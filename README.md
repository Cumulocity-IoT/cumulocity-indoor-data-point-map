# Cumulocity Indoor Data Point Map Widget

The Indoor Data Point Map Widget requires the [Smart Map Settings Widget for Cumulocity](https://github.com/SoftwareAG/cumulocity-smart-map-settings-widget) to work.

The Indoor Data Point Map Widget displays a floor plan and a set of devices, which have been configured using the Smart Map Settings Widget for Cumulocity:

1. Add a new building and building details
2. Add new floor and define the floor level for building
3. Upload floor plan
4. Add devices for the floor

![smart_map_settings](https://user-images.githubusercontent.com/57527184/155541608-245d8013-2f24-4edf-8330-3bf1615ddb35.png)

Configure the The Indoor Data Point Map Widget once you have created the smart map configuration.

1. Select your smart map configuration
2. Based on the devices defined in the smart map configuration the widget will display a list of available measurements. Select the primary measurement, which should be used for the map marker and its coloring
3. Define the legend by adding a title and thresholds for the primary measurement
4. Define what measurements should be displayed in the popup for the map marker

An example:

![indoor_data_point_map_configuration](https://user-images.githubusercontent.com/57527184/155541644-8dca435f-f771-4e96-8513-7617b52d2e9d.png)

**Preview**:

![indoor_data_point_map](https://user-images.githubusercontent.com/57527184/155541688-2f43f4b7-8a4e-4fa8-b687-3c9c76343e67.png)

### Installation - for the dashboards using Runtime Widget Loader
1. Download the latest `indoor-data-point-map-widget-{version}.zip` file from the Releases section.
2. Make sure you have Runtime Widget Loader installed on your Cockpit or App Builder app.
3. Open a dashboard.
4. Click `more...`.
5. Select `Install Widget` and follow the instructions.

### Development - to do the enhancements and testing locally
1. Clone the repository on local machine using `git clone git@github.com:SoftwareAG/cumulocity-indoor-data-point-map.git`.
2. Run `npm install` to download the module dependencies.
3. Update start script in the `package.json` and add your Cumulocity tenant URL: `c8ycli server -u https://your_tenant_url` 
4. Run `npm run start` to start the local server.
5. Go to `http://localhost:9000/apps/cockpit/` in the browser to view and test your changes.

### Build - to create a new build for the Runtime Widget Loader
1. Finish the development and testing on your local machine.
2. Run `npm run runtime` to trigger the build process using gulp
3. Once the build has finished, the newly created zip archive is available in `./runtime/dist/indoor-data-point-map-widget-{version}.zip.zip`

------------------------------
  
This widget is provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.
_____________________
For more information you can Ask a Question in the [TECHcommunity Forums](http://tech.forums.softwareag.com/techjforum/forums/list.page?product=cumulocity).
  
You can find additional information in the [Software AG TECHcommunity](http://techcommunity.softwareag.com/home/-/product/name/cumulocity).

