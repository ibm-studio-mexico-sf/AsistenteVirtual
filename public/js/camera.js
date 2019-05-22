(function(w,d) {

	/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = w.constraints = {
  audio: false,
  video: true
};
const wrapperVideo= d.querySelector('#modal-camera-video');
const video = d.querySelector('video');
let track = null;
const wrapperCanvas= d.querySelector('#modal-camera-preview');
const canvas = w.canvas = d.querySelector('#preview-snapshot');
const photo = d.querySelector('img#photo');
const closeModalBtn = d.querySelector('#btn-close-cam-modal');
const closeModalBtnHeader = d.querySelector('#close-modal-picture-header');
canvas.width = 300;
canvas.height = 300;
let dataUrl="";

const takeSnapshotBtn = d.querySelector('#take-snapshot');
// takeSnapshotBtn.disabled=true;
takeSnapshotBtn.onclick = function() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
	wrapperCanvas.classList.remove('d-none');
	dataUrl = canvas.toDataURL('image/png');
	console.log('img',dataUrl);
	photo.setAttribute('src', dataUrl);
	photo.classList.remove('d-none');
};

async  function handleSuccess(stream) {
  const videoTracks = stream.getVideoTracks();
	track = stream.getTracks()[0];
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  w.stream = stream; // make variable available to browser console
  video.srcObject = stream;
	wrapperVideo.classList.remove('d-none');
}

function handleError(error) {
  if (error.name === 'ConstraintNotSatisfiedError') {
    let v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'PermissionDeniedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = d.querySelector('#modal-camera-error');
  //errorElement.innerHTML += `<span class="badge badge-danger">${msg}</span>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    let valor = await handleSuccess(stream);
    e.target.disabled = true;
		//takeSnapshotBtn.disabled=false;
  } catch (e) {
    handleError(e);
  }
}

async function stop(e){
	try{
		if(track){
			track.stop();
			w.chat.vrav(dataUrl);
		}
		//takeSnapshotBtn.disabled=true;
	}
	catch (e) {
    handleError(e);
  }
}

async function getFileFromCanvas(dataURL){
	var blobBin = atob(dataURL.split(',')[1]);
	var array = [];
	for(var i = 0; i < blobBin.length; i++) {
	    array.push(blobBin.charCodeAt(i));
	}
	var file= new Blob([new Uint8Array(array)], {type: 'image/png'});
	return file;
}
//d.querySelector('#start-camera').addEventListener('click', e => init(e));
//d.querySelector('#stop-camera').addEventListener('click', e => stop(e));
closeModalBtn.addEventListener('click', e => stop(e));
closeModalBtnHeader.addEventListener('click', e => stop(e));
w.camera={
	init:init,
	stop:stop
}

})(window,document);
