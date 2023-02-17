'use strict';

//VARIABLES

const settingsBtn = document.querySelector('.js-settings-btn')
const formEl = document.querySelector('.js-form');
const webcamEl = document.querySelector('.js-webcam-player');
const canvasEl = document.querySelector('.js-canvas');
const photoAlbum = document.querySelector('.js-photo-frame');
const snapAudioEl = document.querySelector('.js-audio-snap');
const photoBtnEl = document.querySelector('.js-photo-btn');
const rgbInputs = document.querySelectorAll('.js-rgb input');
const effectRadioInputs = document.querySelectorAll('.js-effect-radio');
const effectCheckbox = document.querySelector('.js-effect-checkbox');

const context = canvasEl.getContext('2d', {willReadFrequently: true});
let clickedValue = '';


//FUNCTIONS

//WEBCAM
//The image will come from the video element into the canvas, then we will be able to add filters to the canvas to create different effects
function getUserWebCamVideo() {
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
        .then(localMediaStream => {
            webcamEl.srcObject = localMediaStream;
            webcamEl.play();
        })
        .catch(err => {
            console.error('You should allow the access to your camera', err);
        })
}

getUserWebCamVideo();

//PHOTO EFFECTS
function redPhotoEffect(pixelsArray) {
    for(let i = 0; i < pixelsArray.data.length; i += 4){
        pixelsArray.data[i + 0] = pixelsArray.data[i + 0] + 100; // red
        pixelsArray.data[i + 1] = pixelsArray.data[i + 1] - 50; // green
        pixelsArray.data[i + 2] = pixelsArray.data[i + 2] * 0.5;  //blue
    }
    return pixelsArray;
}

function rgbSplitEffect(pixelsArray) {
    for(let i = 0; i < pixelsArray.data.length; i += 4){
        pixelsArray.data[i - 150] = pixelsArray.data[i + 0]; // red
        pixelsArray.data[i + 500] = pixelsArray.data[i + 1]; // green
        pixelsArray.data[i - 500] = pixelsArray.data[i + 2];  //blue
    }
    return pixelsArray;
} 

function greenScreenEffect(pixelsArray) {
    //Object to store minimum and maximum green
    //It works by taking out a range of colors
    const levels = {};
    for(const input of rgbInputs){
        levels[input.name] = input.value;
    }

    for(let i = 0; i < pixelsArray.data.length; i = i + 4){
        let red = pixelsArray.data[i + 0]; 
        let green = pixelsArray.data[i + 1]; 
        let blue = pixelsArray.data[i + 2];

        if(red >= levels.rmin 
            && green >= levels.gmin 
            && blue <= levels.bmin 
            && red <= levels.rmax 
            && green <= levels.gmax 
            && blue <= levels.bmax){
                //Take it out, transparent, alpha chanel equal to 0
                pixelsArray.data[i + 3] = 0;
        }
    }
    return pixelsArray;
}

function ghostEffect() {
    if(effectCheckbox.checked === true){
        if(clickedValue === 'red'){
            return context.globalAlpha = 0.5;
        }else{
            return context.globalAlpha = 0.1;
        }
    }else{
        return context.globalAlpha = 1;
    }
}


//SET EFFECTS

function enableRgbInputs() {
    for(const input of rgbInputs){
        input.removeAttribute('disabled');
    }
}

function disableRgbInputs() {
    for(const input of rgbInputs){
        input.setAttribute('disabled', true);
    }
}

function setEffect(pixelsArray) {
    if(clickedValue === 'none'){
        disableRgbInputs();
        return pixelsArray;
    }else if(clickedValue === 'red'){
        disableRgbInputs();
        ghostEffect(); 
        return redPhotoEffect(pixelsArray);
    }else if(clickedValue === 'rgb'){
        disableRgbInputs();
        ghostEffect();
        return rgbSplitEffect(pixelsArray);
    }else if(clickedValue === 'green'){
        ghostEffect();
        enableRgbInputs();
        return greenScreenEffect(pixelsArray);
    }
}


//CANVAS

function paintVideoToCanvas() {
    const width = webcamEl.videoWidth;
    const height = webcamEl.videoHeight;
    //Set canvas dimensions to match the exact video dimensions
    canvasEl.width = width;
    canvasEl.height = height;
    return setInterval(()=>{
        //ELement to paint, start X and Y, end X and Y
        context.drawImage(webcamEl, 0, 0, width, height);
        //Array of pixels, for each pixel, 4 entries: red, green, blue, alpha
        const originalPixels = context.getImageData(0, 0, width, height);
        let modifiedPixels = setEffect(originalPixels) || originalPixels;
        context.putImageData(modifiedPixels, 0, 0);
    }, 16);
}

//PHOTO
function addRemovePhoto(data) {
    //Create a tag element
    const article = document.createElement('article');
    article.setAttribute('class', 'album__photo')
    const link = document.createElement('a');
    link.href = data;
    link.setAttribute('download', 'screenshot');
    link.innerHTML = `<img src="${data}" alt="Screenshot" class="album__photo--img"/> <i class="album__photo--icon fa-solid fa-cloud-arrow-down"></i>`;
    const deleteBtn = document.createElement('i');
    deleteBtn.setAttribute('class', 'album__photo--delete fa-solid fa-trash');
    deleteBtn.addEventListener('click', () => {
        photoAlbum.removeChild(article);
    });
    article.appendChild(link);
    article.appendChild(deleteBtn);
    photoAlbum.insertBefore(article, photoAlbum.firstChild);
}

function takePhoto(ev) {
    ev.preventDefault();
    //Play photo sound
    snapAudioEl.currentTime = 0;
    snapAudioEl.play();
    //Take the data out of the canvas
    //Text based representation of the photo
    const data = canvasEl.toDataURL('image/jpeg');
    addRemovePhoto(data);
}


//EVENT HANDLERS

function handleEffectRadio(ev) {
    clickedValue = ev.target.value;
}

function handleEffectCheckbox() {
    ghostEffect();
}

function handleSettingsBtn() {
    formEl.classList.toggle('js-hidden');
}


//EVENT LISTENERS

webcamEl.addEventListener('canplay', paintVideoToCanvas);
photoBtnEl.addEventListener('click', takePhoto);
for(const effect of effectRadioInputs){
    effect.addEventListener('click', handleEffectRadio);
}
effectCheckbox.addEventListener('click', handleEffectCheckbox);
settingsBtn.addEventListener('click', handleSettingsBtn);