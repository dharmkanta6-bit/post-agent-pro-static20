# Post Agent Pro - Static Version

This is a static version of the Post Agent Pro application that can be deployed on any static hosting platform like Hostinger, Firebase Hosting, Netlify, or GitHub Pages.

## Features

- **Dashboard**: Overview of collections, deposits, and balance
- **Customer Management**: Add, edit, and manage customer information
- **Collection Management**: Record new collections and view collection history
- **Deposit Management**: Track bank deposits
- **Settings**: Configure agent profile and application settings
- **Data Export**: Export all data as JSON backup
- **Responsive Design**: Works on desktop and mobile devices

## Demo Credentials

- **Email**: demo@postagent.com
- **Password**: demo123

## Installation & Deployment

### Option 1: Direct Upload
1. Download the ZIP file containing all static files
2. Extract the files to your web server's public directory
3. Access your website through your domain

### Option 2: Hostinger
1. Log in to your Hostinger control panel
2. Go to File Manager
3. Navigate to the `public_html` directory
4. Upload all files from the static-site folder
5. Your website will be accessible at your domain

### Option 3: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Create a new Firebase project
3. Run `firebase init hosting`
4. Copy all files to the hosting directory
5. Run `firebase deploy`

### Option 4: Netlify
1. Create a new site on Netlify
2. Drag and drop the static-site folder
3. Your site will be deployed automatically

## File Structure

```
static-site/
├── index.html          # Dashboard page
├── login.html          # Login page
├── customers.html      # Customer management
├── collections.html    # Collection history
├── new-collection.html # Create new collection
├── deposits.html       # Deposit management
├── settings.html       # Application settings
├── styles.css          # Main stylesheet
├── app.js             # Main application logic
├── customers.js       # Customer page functionality
├── favicon.ico        # Website icon
└── README.md          # This file
```

## Data Storage

This static version uses browser localStorage to store all data locally. This means:
- Data is stored on the user's device
- Data persists between browser sessions
- No server or database required
- Data can be exported as JSON backup

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Features Included

### ✅ Working Features
- User authentication (demo mode)
- Dashboard with statistics
- Customer management (CRUD operations)
- Collection management
- Deposit tracking
- Settings management
- Data export functionality
- Responsive design
- Local data storage

### ⚠️ Limitations (Static Version)
- No server-side functionality
- WhatsApp integration is simulated
- No real-time data synchronization
- No user accounts (demo mode only)
- Data stored locally only

## Customization

### Changing Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary: 197 71% 53%;        /* Main brand color */
    --background: 205 100% 95%;    /* Background color */
    --foreground: 240 10% 3.9%;    /* Text color */
    /* ... other variables */
}
```

### Adding New Pages
1. Create a new HTML file
2. Include the same sidebar and header structure
3. Link to the new page in the navigation
4. Add any specific JavaScript functionality

### Modifying Data Structure
Edit the `DEFAULT_DATA` object in `app.js` to change the default data structure.

## Support

This is a static version of the Post Agent Pro application. For the full-featured version with server-side functionality, please refer to the original Next.js application.

## License

This static version is provided as-is for deployment on static hosting platforms.






