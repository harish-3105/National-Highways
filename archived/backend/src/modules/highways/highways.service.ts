import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import {
  CreateHighwayDto,
  UpdateHighwayDto,
  HighwayQueryDto,
  BulkUploadResultDto,
  BulkUploadError,
} from '../../common/dto/highway.dto';
import { JwtPayload, UserRole } from '../../common/types';
import { AuthorizationService } from '../../common/services/authorization.service';
import { AuditService } from '../../common/services/audit.service';
import { createDbPool } from '../../common/database/database.provider';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class HighwaysService {
  private pool: Pool;
  private auditService: AuditService;

  constructor() {
    this.pool = createDbPool();
    this.auditService = new AuditService(this.pool);
  }


  async getAccessibleHighways(user: JwtPayload, queryDto: HighwayQueryDto): Promise<any[]> {
    try {
      const accessibleUserIds = await AuthorizationService.getAccessibleUserIds(
        this.pool,
        user.userId,
        user.role,
      );

      let query = `
        SELECT 
          h.id, h.road_name, h.road_code, h.from_location, h.to_location,
          h.from_chainage, h.to_chainage, h.configuration,
          h.start_latitude, h.start_longitude, h.end_latitude, h.end_longitude,
          h.length_km, h.status, h.created_at, h.updated_at,
          h.parent_highway_id, h.section_number, h.is_parent,
          ST_AsGeoJSON(h.geom) as geometry,
          creator.name as created_by_name,
          div.name as division_name,
          subdiv.name as sub_division_name
        FROM highways h
        LEFT JOIN users creator ON h.created_by = creator.id
        LEFT JOIN users div ON h.division_id = div.id
        LEFT JOIN users subdiv ON h.sub_division_id = subdiv.id
        WHERE h.created_by = ANY($1)
      `;

      const values: any[] = [accessibleUserIds];
      let paramIndex = 2;

      if (queryDto.divisionId) {
        query += ` AND h.division_id = $${paramIndex++}`;
        values.push(queryDto.divisionId);
      }

      if (queryDto.subDivisionId) {
        query += ` AND h.sub_division_id = $${paramIndex++}`;
        values.push(queryDto.subDivisionId);
      }

      if (queryDto.status) {
        query += ` AND h.status = $${paramIndex++}`;
        values.push(queryDto.status);
      }

      if (queryDto.search) {
        query += ` AND (h.road_name ILIKE $${paramIndex} OR h.road_code ILIKE $${paramIndex})`;
        values.push(`%${queryDto.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY h.road_code, h.section_number NULLS FIRST, h.created_at DESC`;

      const result = await this.pool.query(query, values);

      return result.rows.map((row) => ({
        id: row.id,
        roadName: row.road_name,
        roadCode: row.road_code,
        fromLocation: row.from_location,
        toLocation: row.to_location,
        fromChainage: row.from_chainage,
        toChainage: row.to_chainage,
        configuration: row.configuration,
        startLatitude: row.start_latitude,
        startLongitude: row.start_longitude,
        endLatitude: row.end_latitude,
        endLongitude: row.end_longitude,
        lengthKm: row.length_km,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        parentHighwayId: row.parent_highway_id,
        sectionNumber: row.section_number,
        isParent: row.is_parent,
        geometry: JSON.parse(row.geometry),
        createdByName: row.created_by_name,
        divisionName: row.division_name,
        subDivisionName: row.sub_division_name,
      }));
    } catch (error) {
      console.error('Error fetching accessible highways:', error);
      throw error;
    }
  }

  async getHighwaysGeoJSON(user: JwtPayload, queryDto: HighwayQueryDto): Promise<any> {
    const highways = await this.getAccessibleHighways(user, queryDto);

    return {
      type: 'FeatureCollection',
      features: highways.map((highway) => ({
        type: 'Feature',
        id: highway.id,
        properties: {
          id: highway.id,
          roadName: highway.roadName,
          roadCode: highway.roadCode,
          fromLocation: highway.fromLocation,
          toLocation: highway.toLocation,
          fromChainage: highway.fromChainage,
          toChainage: highway.toChainage,
          configuration: highway.configuration,
          lengthKm: highway.lengthKm,
          status: highway.status,
          divisionName: highway.divisionName,
          subDivisionName: highway.subDivisionName,
          parentHighwayId: highway.parentHighwayId,
          isParent: highway.isParent,
        },
        geometry: highway.geometry,
      })),
    };
  }

  async getHighwayById(user: JwtPayload, id: number): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT 
          h.*,
          ST_AsGeoJSON(h.geom) as geometry,
          creator.name as created_by_name,
          creator.role as created_by_role,
          div.name as division_name,
          subdiv.name as sub_division_name
         FROM highways h
         LEFT JOIN users creator ON h.created_by = creator.id
         LEFT JOIN users div ON h.division_id = div.id
         LEFT JOIN users subdiv ON h.sub_division_id = subdiv.id
         WHERE h.id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Highway not found');
      }

      const highway = result.rows[0];

      // Check access
      const canAccess = await AuthorizationService.canAccessResource(
        user,
        highway.created_by,
        'READ',
        this.pool,
      );

      if (!canAccess) {
        throw new ForbiddenException('Access denied to this highway');
      }

      return {
        id: highway.id,
        roadName: highway.road_name,
        roadCode: highway.road_code,
        fromLocation: highway.from_location,
        toLocation: highway.to_location,
        fromChainage: highway.from_chainage,
        toChainage: highway.to_chainage,
        configuration: highway.configuration,
        startLatitude: highway.start_latitude,
        startLongitude: highway.start_longitude,
        endLatitude: highway.end_latitude,
        endLongitude: highway.end_longitude,
        lengthKm: highway.length_km,
        status: highway.status,
        createdAt: highway.created_at,
        updatedAt: highway.updated_at,
        geometry: JSON.parse(highway.geometry),
        createdByName: highway.created_by_name,
        createdByRole: highway.created_by_role,
        divisionName: highway.division_name,
        subDivisionName: highway.sub_division_name,
        divisionId: highway.division_id,
        subDivisionId: highway.sub_division_id,
        createdBy: highway.created_by,
        updatedBy: highway.updated_by,
        parentHighwayId: highway.parent_highway_id,
        sectionNumber: highway.section_number,
        isParent: highway.is_parent,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error fetching highway detail:', error);
      throw error;
    }
  }

  async getHighwayWithSections(user: JwtPayload, id: number): Promise<any> {
    const highway = await this.getHighwayById(user, id);

    if (highway.isParent) {
      try {
        // Fetch all child sections
        const sectionsResult = await this.pool.query(
          `SELECT 
            h.id, h.road_name, h.road_code, h.from_location, h.to_location,
            h.from_chainage, h.to_chainage, h.configuration,
            h.start_latitude, h.start_longitude, h.end_latitude, h.end_longitude,
            h.length_km, h.status, h.created_at, h.updated_at,
            h.parent_highway_id, h.section_number, h.is_parent,
            ST_AsGeoJSON(h.geom) as geometry,
            creator.name as created_by_name,
            div.name as division_name,
            subdiv.name as sub_division_name
          FROM highways h
          LEFT JOIN users creator ON h.created_by = creator.id
          LEFT JOIN users div ON h.division_id = div.id
          LEFT JOIN users subdiv ON h.sub_division_id = subdiv.id
          WHERE h.parent_highway_id = $1
          ORDER BY h.section_number`,
          [id],
        );

        highway.sections = sectionsResult.rows.map((row) => ({
          id: row.id,
          roadName: row.road_name,
          roadCode: row.road_code,
          fromLocation: row.from_location,
          toLocation: row.to_location,
          fromChainage: row.from_chainage,
          toChainage: row.to_chainage,
          configuration: row.configuration,
          startLatitude: row.start_latitude,
          startLongitude: row.start_longitude,
          endLatitude: row.end_latitude,
          endLongitude: row.end_longitude,
          lengthKm: row.length_km,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          parentHighwayId: row.parent_highway_id,
          sectionNumber: row.section_number,
          isParent: row.is_parent,
          geometry: JSON.parse(row.geometry),
          createdByName: row.created_by_name,
          divisionName: row.division_name,
          subDivisionName: row.sub_division_name,
        }));
      } catch (error) {
        console.warn('Falling back to an empty sections list because the database is unavailable.', error);
        highway.sections = [];
      }
    }

    return highway;
  }

  async createHighway(user: JwtPayload, createHighwayDto: CreateHighwayDto): Promise<any> {
    // Skip early geometry validation - it will be validated after auto-calculation for sections
    
    // Validate division/subdivision assignment
    const canAssign = await AuthorizationService.canAssignTo(
      user,
      createHighwayDto.divisionId || null,
      createHighwayDto.subDivisionId || null,
      this.pool,
    );

    if (!canAssign) {
      throw new ForbiddenException('Cannot assign highway to specified division/subdivision');
    }

    // Check if road code already exists (skip for sections as they can share parent's code)
    if (!createHighwayDto.parentHighwayId) {
      const existingResult = await this.pool.query(
        'SELECT id FROM highways WHERE road_code = $1',
        [createHighwayDto.roadCode],
      );

      if (existingResult.rows.length > 0) {
        throw new BadRequestException('Road code already exists');
      }
    }

    // If this is a section, validate parent exists and modify road code
    let finalRoadCode = createHighwayDto.roadCode;
    if (createHighwayDto.parentHighwayId) {
      const parentCheck = await this.pool.query(
        'SELECT id, is_parent FROM highways WHERE id = $1',
        [createHighwayDto.parentHighwayId],
      );

      if (parentCheck.rows.length === 0) {
        throw new BadRequestException('Parent highway not found');
      }

      if (!parentCheck.rows[0].is_parent) {
        throw new BadRequestException('Specified parent is not a parent highway');
      }

      // Append section number to road code for uniqueness (e.g., NH87-S001)
      finalRoadCode = `${createHighwayDto.roadCode}-S${String(createHighwayDto.sectionNumber).padStart(3, '0')}`;
    }

    // For sections, auto-calculate geometry from parent if not provided
    let geometry = createHighwayDto.geometry;
    
    // If it's a section with chainages, always calculate geometry from parent
    if (createHighwayDto.parentHighwayId && createHighwayDto.fromChainage && createHighwayDto.toChainage) {
      // Check for overlapping sections
      await this.checkSectionOverlap(
        createHighwayDto.parentHighwayId,
        createHighwayDto.fromChainage,
        createHighwayDto.toChainage,
        null, // No existing section ID for new sections
      );
      
      const calculatedGeometry = await this.calculateSectionGeometry(
        createHighwayDto.parentHighwayId,
        createHighwayDto.fromChainage,
        createHighwayDto.toChainage,
      );
      
      if (calculatedGeometry) {
        geometry = calculatedGeometry;
      }
    }

    // Validate geometry
    if (!geometry) {
      throw new BadRequestException('Geometry is required. Either provide geometry or specify parent highway with chainages for auto-calculation.');
    }
    
    this.validateGeometry(geometry);

    // Convert GeoJSON to PostGIS geometry
    const geojson = JSON.stringify(geometry);

    // Automatically assign division/subdivision based on user role if not provided
    let divisionId = createHighwayDto.divisionId;
    let subDivisionId = createHighwayDto.subDivisionId;
    
    // For sections, automatically assign to user's division/subdivision if not specified
    if (createHighwayDto.parentHighwayId) {
      if (!divisionId && !subDivisionId) {
        if (user.role === 'DIVISION') {
          divisionId = user.userId;
        } else if (user.role === 'SUB_DIVISION') {
          subDivisionId = user.userId;
          // Get parent division ID
          const parentResult = await this.pool.query(
            'SELECT parent_id FROM users WHERE id = $1',
            [user.userId]
          );
          if (parentResult.rows[0]?.parent_id) {
            divisionId = parentResult.rows[0].parent_id;
          }
        }
      }
    }

    const query = `
      INSERT INTO highways (
        road_name, road_code, from_location, to_location,
        from_chainage, to_chainage, configuration,
        start_latitude, start_longitude, end_latitude, end_longitude,
        geom, division_id, sub_division_id, created_by, status,
        parent_highway_id, section_number, is_parent
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10, $11,
        ST_GeomFromGeoJSON($12), $13, $14, $15, $16,
        $17, $18, $19
      )
      RETURNING 
        id, road_name, road_code, from_location, to_location,
        from_chainage, to_chainage, configuration,
        start_latitude, start_longitude, end_latitude, end_longitude,
        length_km, status, created_at,
        parent_highway_id, section_number, is_parent,
        ST_AsGeoJSON(geom) as geometry
    `;

    const values = [
      createHighwayDto.roadName,
      finalRoadCode,
      createHighwayDto.fromLocation,
      createHighwayDto.toLocation,
      createHighwayDto.fromChainage || null,
      createHighwayDto.toChainage || null,
      createHighwayDto.configuration || null,
      createHighwayDto.startLatitude || null,
      createHighwayDto.startLongitude || null,
      createHighwayDto.endLatitude || null,
      createHighwayDto.endLongitude || null,
      geojson,
      divisionId || null,
      subDivisionId || null,
      user.userId,
      createHighwayDto.status || 'ACTIVE',
      createHighwayDto.parentHighwayId || null,
      createHighwayDto.sectionNumber || null,
      createHighwayDto.isParent || false,
    ];

    const result = await this.pool.query(query, values);
    const highway = result.rows[0];

    // Audit log
    await this.auditService.log({
      userId: user.userId,
      action: 'CREATE',
      entityType: 'HIGHWAY',
      entityId: highway.id,
      newValues: highway,
    });

    const mapped = {
      id: highway.id,
      roadName: highway.road_name,
      roadCode: highway.road_code,
      fromLocation: highway.from_location,
      toLocation: highway.to_location,
      fromChainage: highway.from_chainage,
      toChainage: highway.to_chainage,
      configuration: highway.configuration,
      startLatitude: highway.start_latitude,
      startLongitude: highway.start_longitude,
      endLatitude: highway.end_latitude,
      endLongitude: highway.end_longitude,
      lengthKm: highway.length_km,
      status: highway.status,
      createdAt: highway.created_at,
      parentHighwayId: highway.parent_highway_id,
      sectionNumber: highway.section_number,
      isParent: highway.is_parent,
      geometry: JSON.parse(highway.geometry),
    };

    return mapped;
  }

  async updateHighway(
    user: JwtPayload,
    id: number,
    updateHighwayDto: UpdateHighwayDto,
  ): Promise<any> {
    // Get existing highway
    const existingResult = await this.pool.query(
      'SELECT * FROM highways WHERE id = $1',
      [id],
    );

    if (existingResult.rows.length === 0) {
      throw new NotFoundException('Highway not found');
    }

    const existing = existingResult.rows[0];

    // Check access
    const canUpdate = await AuthorizationService.canAccessResource(
      user,
      existing.created_by,
      'UPDATE',
      this.pool,
    );

    if (!canUpdate) {
      throw new ForbiddenException('Access denied to update this highway');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateHighwayDto.roadName) {
      updates.push(`road_name = $${paramIndex++}`);
      values.push(updateHighwayDto.roadName);
    }

    if (updateHighwayDto.roadCode) {
      updates.push(`road_code = $${paramIndex++}`);
      values.push(updateHighwayDto.roadCode);
    }

    if (updateHighwayDto.fromLocation) {
      updates.push(`from_location = $${paramIndex++}`);
      values.push(updateHighwayDto.fromLocation);
    }

    if (updateHighwayDto.toLocation) {
      updates.push(`to_location = $${paramIndex++}`);
      values.push(updateHighwayDto.toLocation);
    }

    if (updateHighwayDto.fromChainage !== undefined) {
      updates.push(`from_chainage = $${paramIndex++}`);
      values.push(updateHighwayDto.fromChainage);
    }

    if (updateHighwayDto.toChainage !== undefined) {
      updates.push(`to_chainage = $${paramIndex++}`);
      values.push(updateHighwayDto.toChainage);
    }

    // Check for overlapping sections if chainages are being updated
    if (existing.parent_highway_id && (updateHighwayDto.fromChainage || updateHighwayDto.toChainage)) {
      const newFromChainage = updateHighwayDto.fromChainage || existing.from_chainage;
      const newToChainage = updateHighwayDto.toChainage || existing.to_chainage;
      
      await this.checkSectionOverlap(
        existing.parent_highway_id,
        newFromChainage,
        newToChainage,
        id, // Exclude current section from overlap check
      );
    }

    if (updateHighwayDto.configuration !== undefined) {
      updates.push(`configuration = $${paramIndex++}`);
      values.push(updateHighwayDto.configuration);
    }

    if (updateHighwayDto.startLatitude !== undefined) {
      updates.push(`start_latitude = $${paramIndex++}`);
      values.push(updateHighwayDto.startLatitude);
    }

    if (updateHighwayDto.startLongitude !== undefined) {
      updates.push(`start_longitude = $${paramIndex++}`);
      values.push(updateHighwayDto.startLongitude);
    }

    if (updateHighwayDto.endLatitude !== undefined) {
      updates.push(`end_latitude = $${paramIndex++}`);
      values.push(updateHighwayDto.endLatitude);
    }

    if (updateHighwayDto.endLongitude !== undefined) {
      updates.push(`end_longitude = $${paramIndex++}`);
      values.push(updateHighwayDto.endLongitude);
    }

    if (updateHighwayDto.geometry) {
      this.validateGeometry(updateHighwayDto.geometry);
      updates.push(`geom = ST_GeomFromGeoJSON($${paramIndex++})`);
      values.push(JSON.stringify(updateHighwayDto.geometry));
    }

    if (updateHighwayDto.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(updateHighwayDto.status);
    }

    if (updateHighwayDto.divisionId !== undefined) {
      updates.push(`division_id = $${paramIndex++}`);
      values.push(updateHighwayDto.divisionId);
    }

    if (updateHighwayDto.subDivisionId !== undefined) {
      updates.push(`sub_division_id = $${paramIndex++}`);
      values.push(updateHighwayDto.subDivisionId);
    }

    updates.push(`updated_by = $${paramIndex++}`);
    values.push(user.userId);

    if (updates.length === 1) {
      // Only updated_by
      throw new BadRequestException('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE highways
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, road_name, road_code, from_location, to_location,
        from_chainage, to_chainage, configuration,
        start_latitude, start_longitude, end_latitude, end_longitude,
        length_km, status, updated_at,
        ST_AsGeoJSON(geom) as geometry
    `;

    const result = await this.pool.query(query, values);
    const updated = result.rows[0];

    // Audit log
    await this.auditService.log({
      userId: user.userId,
      action: 'UPDATE',
      entityType: 'HIGHWAY',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return {
      id: updated.id,
      roadName: updated.road_name,
      roadCode: updated.road_code,
      fromLocation: updated.from_location,
      toLocation: updated.to_location,
      fromChainage: updated.from_chainage,
      toChainage: updated.to_chainage,
      configuration: updated.configuration,
      startLatitude: updated.start_latitude,
      startLongitude: updated.start_longitude,
      endLatitude: updated.end_latitude,
      endLongitude: updated.end_longitude,
      lengthKm: updated.length_km,
      status: updated.status,
      updatedAt: updated.updated_at,
      geometry: JSON.parse(updated.geometry),
    };
  }

  async deleteHighway(user: JwtPayload, id: number): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can delete highways');
    }

    try {
      const result = await this.pool.query('SELECT * FROM highways WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`Highway with ID ${id} not found`);
      }

      await this.pool.query('DELETE FROM highways WHERE id = $1', [id]);

      // Audit log
      await this.auditService.log({
        userId: user.userId,
        action: 'DELETE',
        entityType: 'HIGHWAY',
        entityId: id,
        oldValues: result.rows[0],
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error deleting highway:', error);
      throw error;
    }
  }

  async getNearbyHighways(user: JwtPayload, id: number, distanceKm: number): Promise<any[]> {
    const query = `
      SELECT 
        h2.id, h2.road_name, h2.road_code,
        ST_Distance(h1.geom::geography, h2.geom::geography) / 1000 as distance_km,
        ST_AsGeoJSON(h2.geom) as geometry
      FROM highways h1
      CROSS JOIN highways h2
      WHERE h1.id = $1 
        AND h2.id != $1
        AND ST_DWithin(h1.geom::geography, h2.geom::geography, $2 * 1000)
      ORDER BY distance_km
      LIMIT 10
    `;

    const result = await this.pool.query(query, [id, distanceKm]);

    return result.rows.map((row) => ({
      ...row,
      geometry: JSON.parse(row.geometry),
    }));
  }

  private async checkSectionOverlap(
    parentHighwayId: number,
    fromChainage: string,
    toChainage: string,
    excludeSectionId?: number | null,
  ): Promise<void> {
    // Parse chainage values
    const fromKm = parseFloat(fromChainage.replace(/[^0-9.]/g, ''));
    const toKm = parseFloat(toChainage.replace(/[^0-9.]/g, ''));

    if (isNaN(fromKm) || isNaN(toKm)) {
      throw new BadRequestException('Invalid chainage format');
    }

    if (fromKm >= toKm) {
      throw new BadRequestException('From chainage must be less than to chainage');
    }

    // Query existing sections for this parent highway
    let query = `
      SELECT id, road_code, from_chainage, to_chainage 
      FROM highways 
      WHERE parent_highway_id = $1
    `;
    
    const params: any[] = [parentHighwayId];
    
    if (excludeSectionId) {
      query += ` AND id != $2`;
      params.push(excludeSectionId);
    }

    const result = await this.pool.query(query, params);

    // Check for overlaps
    const overlaps: string[] = [];
    
    for (const section of result.rows) {
      const existingFrom = parseFloat(section.from_chainage.replace(/[^0-9.]/g, ''));
      const existingTo = parseFloat(section.to_chainage.replace(/[^0-9.]/g, ''));

      // Check if ranges overlap
      // Overlap occurs if: (fromKm < existingTo) AND (toKm > existingFrom)
      if (fromKm < existingTo && toKm > existingFrom) {
        overlaps.push(
          `${section.road_code} (${section.from_chainage} - ${section.to_chainage})`
        );
      }
    }

    if (overlaps.length > 0) {
      throw new BadRequestException(
        `⚠️ Section overlap detected! The chainage range ${fromChainage} - ${toChainage} overlaps with existing section(s): ${overlaps.join(', ')}. Please adjust the chainage values to avoid overlap.`
      );
    }
  }

  private validateGeometry(geometry: any): void {
    if (!geometry || geometry.type !== 'LineString') {
      throw new BadRequestException('Geometry must be a LineString');
    }

    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
      throw new BadRequestException('LineString must have at least 2 points');
    }

    // Validate each coordinate
    for (const coord of geometry.coordinates) {
      if (!Array.isArray(coord) || coord.length < 2) {
        throw new BadRequestException('Invalid coordinate format');
      }

      const [lng, lat] = coord;

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new BadRequestException('Coordinates out of valid range');
      }
    }
  }

  private async calculateSectionGeometry(
    parentId: number,
    fromChainage: string,
    toChainage: string,
  ): Promise<any> {
    // Get parent highway geometry, total length, and chainage range
    const parentResult = await this.pool.query(
      `SELECT ST_AsGeoJSON(geom) as geometry, length_km, from_chainage, to_chainage 
       FROM highways WHERE id = $1`,
      [parentId],
    );

    if (parentResult.rows.length === 0) {
      throw new BadRequestException('Parent highway not found');
    }

    const parentGeometry = JSON.parse(parentResult.rows[0].geometry);
    const totalLength = parseFloat(parentResult.rows[0].length_km);
    
    // Get parent chainage range
    const parentFromChainage = parentResult.rows[0].from_chainage;
    const parentToChainage = parentResult.rows[0].to_chainage;
    const parentFromKm = parentFromChainage ? parseFloat(parentFromChainage.replace(/[^0-9.]/g, '')) : 0;
    const parentToKm = parentToChainage ? parseFloat(parentToChainage.replace(/[^0-9.]/g, '')) : totalLength;

    // Parse section chainage values (e.g., "50.00 km" -> 50.00)
    const sectionFromKm = parseFloat(fromChainage.replace(/[^0-9.]/g, ''));
    const sectionToKm = parseFloat(toChainage.replace(/[^0-9.]/g, ''));

    if (isNaN(sectionFromKm) || isNaN(sectionToKm)) {
      throw new BadRequestException('Invalid chainage format');
    }

    // Determine if chainages are absolute or relative
    // If section chainage is within parent's chainage range, treat as absolute
    // Otherwise, treat as relative (starting from 0)
    let actualFromKm: number;
    let actualToKm: number;

    const parentChainageRange = parentToKm - parentFromKm;

    if (sectionFromKm >= parentFromKm && sectionToKm <= parentToKm) {
      // Absolute chainages - convert to relative position within chainage range
      actualFromKm = sectionFromKm - parentFromKm;
      actualToKm = sectionToKm - parentFromKm;
    } else {
      // Relative chainages (starting from 0)
      actualFromKm = sectionFromKm;
      actualToKm = sectionToKm;
    }

    // Calculate fraction along the line (0 to 1)
    // Use chainage range instead of geometry length for more accurate positioning
    const startFraction = actualFromKm / parentChainageRange;
    const endFraction = actualToKm / parentChainageRange;

    // Validate fractions are within bounds
    if (startFraction < 0 || startFraction > 1 || endFraction < 0 || endFraction > 1) {
      throw new BadRequestException(
        `Chainage values (${sectionFromKm}-${sectionToKm} km) are outside the parent highway range (${parentFromKm}-${parentToKm} km, length: ${totalLength} km)`
      );
    }

    // Use PostGIS ST_LineSubstring to extract the portion of the parent's LineString
    // This preserves all intermediate points from the parent highway, not just start/end
    const geometryResult = await this.pool.query(
      `SELECT ST_AsGeoJSON(
        ST_LineSubstring(
          ST_GeomFromGeoJSON($1),
          $2,
          $3
        )
      ) as geometry`,
      [JSON.stringify(parentGeometry), startFraction, endFraction],
    );

    return JSON.parse(geometryResult.rows[0].geometry);
  }

  async bulkUploadHighways(user: JwtPayload, fileBuffer: Buffer): Promise<BulkUploadResultDto> {
    const rows: any[] = [];
    const errors: BulkUploadError[] = [];

    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(fileBuffer.toString());
      stream
        .pipe(csvParser())
        .on('data', (row: any) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Group rows by highway number (New NH No.)
    const highwayGroups = new Map<string, any[]>();
    rows.forEach((row, index) => {
      const nhNo = row['New NH No.']?.toString().trim();
      if (nhNo) {
        if (!highwayGroups.has(nhNo)) {
          highwayGroups.set(nhNo, []);
        }
        const group = highwayGroups.get(nhNo);
        if (group) {
          group.push({ ...row, rowIndex: index + 2 }); // +2 for header + 1-indexed
        }
      }
    });

    let successCount = 0;
    let failedCount = 0;

    // Process each highway
    for (const [nhNo, highwayRows] of highwayGroups) {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get highway details from first row
        const firstRow = highwayRows[0];
        const roadName = firstRow['Description']?.trim();
        const division = firstRow['Division']?.trim();
        const fromLocation = firstRow['From']?.trim();
        const toLocation = firstRow['To']?.trim();

        if (!roadName || !fromLocation || !toLocation) {
          errors.push({
            row: firstRow.rowIndex,
            highway: `NH-${nhNo}`,
            error: 'Missing required fields: Description, From, or To',
          });
          failedCount += highwayRows.length;
          await client.query('ROLLBACK');
          continue;
        }

        // Create parent highway
        const roadCode = `NH-${nhNo}`;
        
        // Calculate total chainage range
        let minChainage = Infinity;
        let maxChainage = -Infinity;
        
        highwayRows.forEach(row => {
          const configs = ['2L', '2L+PS', '4L', '4L+PS / 6L'];
          configs.forEach(config => {
            const fromKm = parseFloat(row[`From km`]);
            const toKm = parseFloat(row[`To km`]);
            if (!isNaN(fromKm)) minChainage = Math.min(minChainage, fromKm);
            if (!isNaN(toKm)) maxChainage = Math.max(maxChainage, toKm);
          });
        });

        // Create simple line geometry (straight line from first to last point)
        // In production, you might want to use actual coordinates or fetch from OSRM
        const geometry = {
          type: 'LineString',
          coordinates: [
            [0, 0], // Placeholder - should be actual coordinates
            [0.01, 0.01], // Placeholder
          ],
        };

        // Insert parent highway
        const parentResult = await client.query(
          `INSERT INTO highways (
            road_name, road_code, from_location, to_location, 
            from_chainage, to_chainage, geom, is_parent, status, 
            created_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromGeoJSON($7), $8, $9, $10, NOW())
          RETURNING id`,
          [
            roadName,
            roadCode,
            fromLocation,
            toLocation,
            minChainage === Infinity ? null : `${minChainage.toFixed(3)} km`,
            maxChainage === -Infinity ? null : `${maxChainage.toFixed(3)} km`,
            JSON.stringify(geometry),
            true,
            'ACTIVE',
            user.userId,
          ],
        );

        const parentId = parentResult.rows[0].id;

        // Create sections for each configuration change
        let sectionNumber = 1;
        for (const row of highwayRows) {
          try {
            // Parse configuration columns
            const configs = ['2L', '2L+PS', '4L', '4L+PS / 6L'];
            
            for (const configType of configs) {
              const fromKm = parseFloat(row[`From km`]);
              const toKm = parseFloat(row[`To km`]);
              const length = parseFloat(row['Length']);

              if (!isNaN(fromKm) && !isNaN(toKm) && length > 0) {
                // Determine configuration
                let configuration = 'TWO_LANE';
                if (configType === '2L+PS') configuration = 'TWO_LANE_PAVED_SHOULDER';
                else if (configType === '4L') configuration = 'FOUR_LANE';
                else if (configType === '4L+PS / 6L') configuration = 'SIX_LANE';

                // Insert section
                await client.query(
                  `INSERT INTO highways (
                    road_name, road_code, from_location, to_location,
                    from_chainage, to_chainage, configuration, geom,
                    parent_highway_id, section_number, is_parent, status,
                    created_by, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromGeoJSON($8), $9, $10, $11, $12, $13, NOW())`,
                  [
                    roadName,
                    roadCode,
                    fromLocation,
                    toLocation,
                    `${fromKm.toFixed(3)} km`,
                    `${toKm.toFixed(3)} km`,
                    configuration,
                    JSON.stringify(geometry),
                    parentId,
                    sectionNumber,
                    false,
                    'ACTIVE',
                    user.userId,
                  ],
                );

                sectionNumber++;
                successCount++;
              }
            }
          } catch (error) {
            errors.push({
              row: row.rowIndex,
              highway: roadCode,
              error: error.message || 'Failed to create section',
            });
            failedCount++;
          }
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        errors.push({
          row: highwayRows[0].rowIndex,
          highway: `NH-${nhNo}`,
          error: error.message || 'Failed to create highway',
        });
        failedCount += highwayRows.length;
      } finally {
        client.release();
      }
    }

    return {
      success: successCount > 0,
      totalProcessed: rows.length,
      successCount,
      failedCount,
      errors,
      message: `Processed ${rows.length} rows. Success: ${successCount}, Failed: ${failedCount}`,
    };
  }

  async bulkUploadSections(user: JwtPayload, parentHighwayId: number, fileBuffer: Buffer): Promise<BulkUploadResultDto> {
    const rows: any[] = [];
    const errors: BulkUploadError[] = [];

    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(fileBuffer.toString());
      stream
        .pipe(csvParser())
        .on('data', (row: any) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Verify parent highway exists and get details
    const parentResult = await this.pool.query(
      'SELECT id, road_code, road_name, from_location, to_location FROM highways WHERE id = $1 AND is_parent = true',
      [parentHighwayId]
    );

    if (parentResult.rows.length === 0) {
      throw new BadRequestException('Parent highway not found or is not marked as parent');
    }

    const parentHighway = parentResult.rows[0];

    // Get existing sections count to determine starting section number
    const sectionCountResult = await this.pool.query(
      'SELECT COALESCE(MAX(section_number), 0) as max_section FROM highways WHERE parent_highway_id = $1',
      [parentHighwayId]
    );
    let sectionNumber = sectionCountResult.rows[0].max_section + 1;

    let successCount = 0;
    let failedCount = 0;

    // Configuration mapping
    const configMap: { [key: string]: string } = {
      '2L': 'TWO_LANE',
      '2L+PS': 'TWO_LANE_PAVED_SHOULDER',
      '4L': 'FOUR_LANE',
      '4L+PS': 'FOUR_LANE_PAVED_SHOULDER',
      '6L': 'SIX_LANE',
      '6L+PS': 'SIX_LANE_PAVED_SHOULDER',
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 for header + 1-indexed

      try {
        // Parse CSV columns (SI.no, from_chainage, to_chainage, configuration)
        const fromChainage = row['from_chainage'] || row['from_lineage'] || row['From Chainage'];
        const toChainage = row['to_chainage'] || row['to_lineage'] || row['To Chainage'];
        const configCode = (row['configuration'] || row['Configuration'])?.toString().trim().toUpperCase();

        if (!fromChainage || !toChainage || !configCode) {
          errors.push({
            row: rowNumber,
            highway: `Section ${sectionNumber}`,
            error: 'Missing required fields: from_chainage, to_chainage, or configuration',
          });
          failedCount++;
          continue;
        }

        // Map configuration code
        const configuration = configMap[configCode];
        if (!configuration) {
          errors.push({
            row: rowNumber,
            highway: `Section ${sectionNumber}`,
            error: `Invalid configuration code: ${configCode}. Valid values: 2L, 2L+PS, 4L, 4L+PS, 6L, 6L+PS`,
          });
          failedCount++;
          continue;
        }

        // Parse chainage values
        const fromKm = parseFloat(fromChainage.toString().replace(/[^0-9.]/g, ''));
        const toKm = parseFloat(toChainage.toString().replace(/[^0-9.]/g, ''));

        if (isNaN(fromKm) || isNaN(toKm) || fromKm >= toKm) {
          errors.push({
            row: rowNumber,
            highway: `Section ${sectionNumber}`,
            error: 'Invalid chainage values. From chainage must be less than To chainage',
          });
          failedCount++;
          continue;
        }

        // Auto-calculate geometry from parent highway
        let geometry;
        try {
          geometry = await this.calculateSectionGeometry(
            parentHighwayId,
            `${fromKm.toFixed(3)} km`,
            `${toKm.toFixed(3)} km`,
          );
        } catch (error) {
          errors.push({
            row: rowNumber,
            highway: `Section ${sectionNumber}`,
            error: `Failed to calculate geometry: ${error.message}`,
          });
          failedCount++;
          continue;
        }

        // Create section
        const roadCode = `${parentHighway.road_code}-S${String(sectionNumber).padStart(3, '0')}`;
        const fromLocation = `${parentHighway.from_location} (km ${fromKm})`;
        const toLocation = `${parentHighway.to_location} (km ${toKm})`;

        // Automatically assign division/subdivision based on user role
        let divisionId = null;
        let subDivisionId = null;
        
        if (user.role === 'DIVISION') {
          divisionId = user.userId;
        } else if (user.role === 'SUB_DIVISION') {
          subDivisionId = user.userId;
          // Get parent division ID
          const parentResult = await this.pool.query(
            'SELECT parent_id FROM users WHERE id = $1',
            [user.userId]
          );
          if (parentResult.rows[0]?.parent_id) {
            divisionId = parentResult.rows[0].parent_id;
          }
        }

        await this.pool.query(
          `INSERT INTO highways (
            road_name, road_code, from_location, to_location,
            from_chainage, to_chainage, configuration, geom,
            parent_highway_id, section_number, is_parent, status,
            division_id, sub_division_id, created_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromGeoJSON($8), $9, $10, $11, $12, $13, $14, $15, NOW())`,
          [
            parentHighway.road_name,
            roadCode,
            fromLocation,
            toLocation,
            `${fromKm.toFixed(3)} km`,
            `${toKm.toFixed(3)} km`,
            configuration,
            JSON.stringify(geometry),
            parentHighwayId,
            sectionNumber,
            false,
            'ACTIVE',
            divisionId,
            subDivisionId,
            user.userId,
          ],
        );

        sectionNumber++;
        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          highway: `Section ${sectionNumber}`,
          error: error.message || 'Failed to create section',
        });
        failedCount++;
      }
    }

    return {
      success: successCount > 0,
      totalProcessed: rows.length,
      successCount,
      failedCount,
      errors,
      message: `Processed ${rows.length} sections. Success: ${successCount}, Failed: ${failedCount}`,
    };
  }
}
