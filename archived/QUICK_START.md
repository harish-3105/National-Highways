# Quick Start Guide - Highways Management System

## ⚡ Fastest Way to Get Started

### Option 1: Using Docker (Recommended)

```bash
# Navigate to project directory
cd <project-root>

# Run the start script
./start.sh
```

PowerShell (Windows):
```powershell
cd C:\Projects\highwaysProject
./start.ps1
```

That's it! The system will:
1. Build all Docker images
2. Start PostgreSQL with PostGIS
3. Start Backend API
4. Start Frontend
5. Run database migrations
6. Seed sample data

**Access the application:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Login with: `admin` / `admin123`

### Option 2: Development Setup

```bash
# Navigate to project directory
cd <project-root>

# Run the setup script
./setup-dev.sh
```

PowerShell (Windows):
```powershell
cd C:\Projects\highwaysProject
./setup-dev.ps1
```

Then start the services in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🎯 First Steps After Installation

### 1. Login to the System
- Open http://localhost:3001
- Use credentials: `admin` / `admin123`
- You'll see the Dashboard

### 2. Explore the Map
- Click **Map View** in sidebar
- See sample highways visualized on the map
- Click on any highway to see details

### 3. View Highways List
- Click **Highways** in sidebar
- See tabular list of all highways
- Try searching or filtering

### 4. Create a New Highway
- Click **Add Highway** button
- Fill in the form:
  - Road Name: "Test Highway 1"
  - Road Code: "TH-001"
  - From: "Mumbai"
  - To: "Pune"
  - Draw on map or enter coordinates
  - Status: Active
- Click **Save**

### 5. Manage Users (ADMIN only)
- Click **Users** in sidebar
- See hierarchical organization
- Click **Add User** to create new user
- Assign appropriate role and parent

---

## 🔐 Default User Accounts

### Admin Account
```
Username: admin
Password: admin123
Role: ADMIN
Access: Full system access
```

### Division Accounts
```
Username: div_north, div_south, div_east, div_west
Password: admin123
Role: DIVISION
Access: Own division + sub-divisions
```

### Sub-Division Accounts
```
Username: subdiv_n1, subdiv_s1, subdiv_e1, subdiv_w1
Password: admin123
Role: SUB_DIVISION
Access: Own records only
```

⚠️ **Important:** Change these passwords in production!

---

## 📊 Sample Data Included

The system comes with:
- **1 Admin user**
- **4 Division users** (North, South, East, West)
- **5 Sub-division users**
- **6 Sample highways** with real coordinates:
  - NH-1: Delhi to Amritsar
  - NH-2: Delhi to Kolkata
  - NH-8: Delhi to Mumbai
  - NH-7: Varanasi to Kanyakumari
  - SH-20: Chennai to Bangalore
  - EH-1: Pune to Goa (Under Construction)

---

## 🔧 Common Tasks

### View Logs
```bash
# Docker deployment
docker-compose logs -f

# View specific service
docker-compose logs -f backend
```

PowerShell (Windows):
```powershell
docker compose logs -f
docker compose logs -f backend
```

### Restart Services
```bash
# Docker
docker-compose restart

# Development (Ctrl+C then restart npm run dev)
```

PowerShell (Windows):
```powershell
docker compose restart
```

### Stop Services
```bash
# Docker
docker-compose down

# Development (Ctrl+C in terminal)
```

PowerShell (Windows):
```powershell
docker compose down
```

### Reset Database
```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm highwaysproject_postgres_data

# Start again
./start.sh
```

PowerShell (Windows):
```powershell
docker compose down
docker volume rm highwaysproject_postgres_data
./start.ps1
```

PowerShell (Windows):
```powershell
./start.ps1
```

---

## 🗺️ Using the Map Feature

### Viewing Highways
1. Navigate to **Map View**
2. Highways are displayed as colored lines:
   - Blue = Active
   - Red = Inactive/Closed
   - Orange = Under Construction
3. Click any highway to see popup with details

### Creating Highway with Map (Future)
1. Go to **Highways** → **Add Highway**
2. Fill basic details
3. Use map to draw route:
   - Click points on map to create polyline
   - Double-click to finish
4. Save the highway

---

## 📱 Testing Different Roles

### Test as ADMIN
```
Login: admin / admin123
Can do:
✅ View all highways
✅ Create/Edit/Delete highways
✅ Manage all users
✅ Access all features
```

### Test as DIVISION
```
Login: div_north / admin123
Can do:
✅ View own + sub-division highways
✅ Create/Edit highways
✅ Manage sub-division users
❌ Cannot delete highways
❌ Cannot create division users
```

### Test as SUB_DIVISION
```
Login: subdiv_n1 / admin123
Can do:
✅ View own highways
✅ Create/Edit own highways
❌ Cannot delete highways
❌ Cannot manage users
```

---

## 🔍 Verifying Installation

### Check Backend Health
```bash
curl http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return success with token.

### Check Database
```bash
# Docker
docker-compose exec postgres psql -U postgres -d highways_db -c "SELECT COUNT(*) FROM highways;"

# Should show: count = 6
```

PowerShell (Windows):
```powershell
docker compose exec postgres psql -U postgres -d highways_db -c "SELECT COUNT(*) FROM highways;"
```

### Check Frontend
Open http://localhost:3001 - should show login page.

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000  # Backend
lsof -i :3001  # Frontend
lsof -i :5432  # PostgreSQL

# Kill the process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Frontend Can't Connect to Backend
1. Check backend is running: `curl http://localhost:3000/api/health`
2. Check CORS settings in backend `.env`
3. Verify `VITE_API_URL` in frontend `.env`

### JWT Token Issues
- Tokens expire after 24 hours
- Clear browser localStorage: `localStorage.clear()`
- Login again

---

## 📖 Next Steps

1. **Read Full Documentation**: Check `README.md`
2. **API Reference**: See `API_DOCUMENTATION.md`
3. **Architecture**: Read `PROJECT_STRUCTURE.md`
4. **Customize**: Modify `.env` files for your setup
5. **Deploy**: Use `docker-compose --profile production up`

---

## 💡 Pro Tips

1. **Development Mode**: Use `npm run dev` for hot reload
2. **Production Build**: Use Docker for consistent deployment
3. **Database Backup**: `docker-compose exec postgres pg_dump -U postgres highways_db > backup.sql`
4. **View Network**: `docker network inspect highwaysproject_highways_network`
5. **Database GUI**: Use pgAdmin or DBeaver to connect to localhost:5432

---

## 🎓 Learning Resources

- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev
- **PostGIS Guide**: https://postgis.net/documentation
- **Leaflet Docs**: https://leafletjs.com
- **Docker Guide**: https://docs.docker.com

---

## ✅ Success Checklist

After setup, you should be able to:
- [ ] Login successfully
- [ ] See dashboard with statistics
- [ ] View highways on map
- [ ] Create a new highway
- [ ] View user hierarchy (if ADMIN)
- [ ] Logout and login as different user

---

**Need Help?**
- Check logs: `docker-compose logs -f`
- Windows: `docker compose logs -f`
- Review `.env` configuration
- Ensure all dependencies are installed
- Read error messages carefully

**Ready to Deploy to Production?**
- See deployment section in `README.md`
- Update environment variables
- Configure SSL/TLS
- Set strong passwords
- Enable monitoring

---

🚀 **Happy Highway Management!**
