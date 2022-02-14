built from [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)

![](src/assets/img/logo128.png)
#Signer 2

##Install
```shell
npm install
```
## Run for dev
For Chrome browser
```shell
npm run start:chrome
```
For Firefox browser
```shell
npm run start:firefox
```
You can run both command parallel.

Then you can get extension directly in browser by links:
- http://127.0.0.1:3001/popup.html - for Chrome build
- http://127.0.0.1:3002/popup.html - for Firefox build

You can get all files by link `http://127.0.0.1:{port}/` also, where `port` depends on which process you need. 

##How to build
###Chrome
```shell
npm run build:chrome
```
Then you can find a build in `build/chrom` folder.
For opening it in Chrome:
1. Go to `chrome://extensions/` in Chrome browser
2. Enable `Developer mode` (right top corner, at least for Chrome 98)
3. Click on `Load unpacked` button (left top corner)
4. Choice and open `build/chrom` folder

###Firefox
```shell
npm run build:firefox
```
Then you can find a build in `build/firefox` folder.
For opening it in Firefox:
1. Go to `about:debugging#/runtime/this-firefox` in Firefox browser
2. Click on `Load Temporary Add-on...` button.
3. Choice `build/firefox/manifest.json` file

###Safari
```shell
npm run build:safari
```
Then you can find extension in your Safari browser. Allow unsigned extensions If you couldn't find it:
1. Enable `Develop` menu: Safari -> Preferences -> Advanced -> Show Develop menu in menu bar
2. Go to `Develop` menu
3. Click on `Allow Unsigned Extensions`

After that go to Safari -> Preferences -> Extensions and you can see it there