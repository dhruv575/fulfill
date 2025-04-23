**Fulfill NJ Data Dashboard Technical Description**  
---

Dhruv Gupta 							      	        		   Hack4Impact

**Project Proposal**

We would like to develop a data dashboard for the organization Fulfill NJ, which provides several services including but not limited to distribution of food to people in Monmouth and Ocean County of New Jersey. We would like to allow them to visualize a lot of their data on a map which allows them to view which zip codes are most in need and which they are currently not infiltrating as of yet.

We would like to combine 3 different types of data for this project. The first is "zips", which include demographic information of the zip code, as well as information about how many pounds of food in general and specifically produce were distributed by Fulfill within that code. Then, we have information on "locations," which are like the catch all for all Fulfill's services (i.e. benefits assistance, community gardens, afterschool programs). Next, we have "suppliers". Suppliers are places that donate food to Fulfill locations (i.e. lots of supermarkets donating to local churches), and the locations then distribute food.

We want to be able to plot all of these on a map that includes just Momouth and Ocean county. They should all be highly tunable (i.e. we should be able to look at only one at a time as we like, and also filter the inside of them more).

We want to be able to calculate "need" values for each zip code as well, and see if that need is being satisfied.

**Proposed Technical Stack**

* **MongoDB \+ Express \+ Node**: We will intend to use MongoDB for storage of zips, agencies, locations, and partners.  
* **Vercel:** Both the backend and frontend will be deployed on Vercel (in different deployments of course)  
* **ReactMapboxGL:** ReacMapboxGL will be used for plotting things on the map  
* **GEOJSON files:** We have New Jersey zip code GeoJSON files  
* **React:** The frontend will be all react. The app has been created using npx create-react-app to begin with.

**Backend Setup**

We have begun by creating a new react project. In the root of that, we have created a new folder called "backend". In the backend, we have run npm init \-y

**Location Model**  
    Name (String)  
    Address (String)  
    Category (String)

**Supplier Model**  
    Identifier (String)  
    Address (String)  
    Partners (String, but the string is an array. For example, something like "\["Mercy Center"\]")

**Zip Model**  
    geography (String, which is the zip code i.e. "07746")  
    county (String)  
    tot\_pop (number)  
    pct\_food\_insecure (number)  
    number\_food\_insecure (number)  
    unemployment\_rate (number)  
    pct\_black (number)  
    pct\_poverty (number)  
    pct\_hispanic (number)  
    median\_income (number)  
    pct\_homeowners (number)  
    pct\_disability (number)  
    produce (number)  
    all (number)

**Backend Development Steps**

These steps are to be followed by Cursor Agent running Claude 3.7 Sonnet. Each step should only be completed one at a time, and after each step is completed, the readme file should be updated accordingly.

1. Set up the file directory and all necessary introductory files for the project. Install any necessary components.  
2. Create and define our 3 different file models  
3. Build the controllers and routes needed to add and remove each of our models. Then, create routes to query the lists of them.

**Frontend Development Steps**

1. Create a file directory with images, components, data and pages. Create a global API variable that is set and can be edited for where the server is hosted  
2. The whole website should be password protected. When someone enters the password, which should be "MonmouthAndOcean", it should keep them logged in for 30 days  
3. We should begin with creating some basic components like a header and footer. It should have both the Hack4Impact (developers) and Fulfill NJ logos. Access the logos from src/images/HackLogo.png and src/images/FulfillLogo.png  
4. The home page should have a quick description of the project and an explanation of the features of the map  
5. Next, we should develop the data viewing and manipulation dashboard. This dashboard should have a tab for each of our 3 data points. Each tab should initially just show a list of all our current data with all of their columns. You should be able to do a few things  
   1. Export all data as a CSV  
   2. Import new data as a CSV (we should also provide a downloadable CSV with the correct headers)  
   3. Delete all data (if someone does, it should automatically download a CSV called archive\_of\_{datatype} beforehand)  
   4. Delete any piece of data via a button  
   5. Add any piece of data via a popup  
6. Lastly, we should develop the actual map component, which may in itself have several smaller components  
   1. A react mapbox gl component that is zeroed in on Monmouth and Ocean Counties  
   2. The left 1/5th should be used for various menus.  
   3. A layer that, using the provided GeoJSON in src/data/filtered\_nj\_zip\_codes.min.json, creates and delineates the boundaries of each zip code on the map. If clicked on, a part of the menu on the left side of the screen should show the data with that zip code  
   4. A way to plot all of the locations, with different colors for each location category. If hovered over, more data should appear  
   5. A way to plot all the suppliers. If hovered over, more data should appear  
   6. Ways to effectively filter what data is shown on the left side menu  
   7. A way to color the zip codes with different shades of blue based on a calculation of "need". This should be able to be turned on or off  
   8. A way to zoom in and lock on any zip code

**Necessary Keys and Variables**
ATLAS_URI=mongodb+srv://dhruvgupta:qoE0MrtaVtUmlFyD@fulfillnj.fz1wk.mongodb.net/?retryWrites=true&w=majority&appName=fulfillNJ
COOKIE_SECRET=hrowuifhcirebvuwfhlcbeirudhkvoerwvnehroivhenroivheroiv
REACTMAPBOXGL_KEY = pk.eyJ1IjoiZGhydXZndXAiLCJhIjoiY20yZjRoaHF1MDU3ZTJvcHFydGNoemR3bSJ9.IQmyIaXEYPl2NWrZ7hHJxQ

**Current Progress**

**Backend Development:**
- ✅ Set up file directory and necessary introductory files
- ✅ Created and defined all 3 data models (Location, Supplier, Zip)
- ✅ Built controllers and routes for CRUD operations on all models
- ✅ Implemented CSV export routes for data download
- ✅ Added CSV template generation routes
- ✅ Set up authentication endpoints for login functionality

**Frontend Development:**
- ✅ Created file directory with images, components, pages, and services
- ✅ Implemented password protection for the entire application
- ✅ Created header and footer components with appropriate logos
- ✅ Developed home page with project description
- ✅ Built data dashboard with tabs for all three data types
  - ✅ Implemented data viewing in tabular format
  - ✅ Added CSV export functionality
  - ✅ Added CSV template download
  - ✅ Created UI for data import functionality
  - ✅ Implemented delete operations (individual and bulk)
  - ✅ Added data creation via popup forms
- 🟡 Map component (Partially Implemented)
  - ✅ Integrated Mapbox with proper configuration
  - ✅ Implemented zip code boundary visualization
  - ✅ Created UI for filtering map data
  - ✅ Added location and supplier layers
  - 🟡 Location and supplier data integration (partially working)
  - 🟡 Need calculation visualization (structure in place)
  - 🟡 Zip code selection and zoom functionality (partially implemented)
  - ❌ Comprehensive filtering of data on the map

**Known Issues:**
- Connection issues between frontend and backend
- Error handling has been implemented but requires refinement
- Some map features are implemented but not fully functional
- CSV import functionality needs more testing

# Fulfill NJ Data Dashboard

Frontend for the Fulfill NJ Data Dashboard application.

## Deployment to Vercel

### Prerequisites

- A Vercel account
- The Vercel CLI installed (`npm i -g vercel`)

### Environment Variables

The following environment variables need to be set in the Vercel dashboard:

- `REACT_APP_API_URL`: URL of the backend API (e.g., https://fulfill-backend.vercel.app/api)

### Deployment Steps

1. Login to Vercel CLI:
   ```
   vercel login
   ```

2. Deploy the frontend:
   ```
   vercel
   ```

3. For production deployment:
   ```
   vercel --prod
   ```

### Configuration

The frontend is configured for Vercel deployment using the `vercel.json` file.

## Development

To run the frontend locally:

```
npm install
npm start
```

The application will run on port 3000 by default and connect to the backend at the URL specified in `.env.development`.