## 0) Concept

This script is a cover generator for Spotify playlists. It uses the Spotify API to get the tracks of a playlist and mix 25 random covers of the playlist's tracks

## 1) Warning

This script is a proof of concept and needs to be improved. Use it only in a playlist with 25 different covers (there is nos secruity check for now)

## 2) Usage

-   Clone the repository
-   Create a file named `.env` at the root of the project and add the following content:

```
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
```

-   Install the dependencies with `npm install`
-   Run the script with `npm run test`
-   Open the url provided by the script in your browser
-   Link your spotify account
-   Select the playlist you want to generate a cover for
-   Wait for the cover to be generated
-   Enjoy the result as `out.png`

## 3) License

This project is licensed under the MIT License - see the [license.txt](license.txt) file for details

## 4) Contributing

Feel free to contribute to this project by opening issues or pull requests
