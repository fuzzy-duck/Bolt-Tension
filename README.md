# Fuzzy electron


## To Use

JS Files from the original project are located in the js directory. Renderer.js contains the function sendPacket Example use: sendPacket('WORK')

The main.js in the root folder is where we set up the electron config. It's in there we set the window size and remove the frame. 


## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/simonproudfoot/newcastle-electron.git
# Go into the repository
cd newcastle-electron
# Install dependencies
npm install
# Run the app
npm start

# to create the windows App
npm package-win
# to create the mac App
npm package-mac

```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.
