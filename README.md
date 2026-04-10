# AquaScope Kuching

AquaScope Kuching is a high-precision flood simulation and land analysis tool tailored for the unique geography of Kuching, Sarawak. It combines global elevation data with local land parcel information (LASIS) and hydraulic infrastructure mapping to provide a comprehensive view of flood risks.

## Features

- **High-Precision Flood Simulation**: Visualize sea level rise and tide influence from 0m to 60m.
- **Google Maps Integration**: Switch between Street, Satellite, Terrain, and Hybrid views.
- **LASIS Land Parcels**: Interactive land plot boundaries with title types and lot numbers.
- **Hydraulic Infrastructure**: Mapping of major rivers, monsoon drains, and flood control barrages.
- **Property Market Integration**: Browse real estate listings with integrated flood risk analysis.
- **Live News Feed**: Stay updated with land and housing news from official Sarawak sources.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aquascope-kuching.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured for easy deployment to **GitHub Pages**.

1. Update `next.config.ts` with your repository name if using a project page.
2. Push to the `main` branch.
3. The GitHub Action will automatically build and deploy the site.

## Data Sources

- **Elevation**: Open-Elevation API
- **Flood Data**: Firetree.net
- **Map Tiles**: Google Maps API
- **Land Info**: Sarawak Land and Survey Dept (LASIS)
- **News**: DayakDaily, Land & Survey Dept

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
