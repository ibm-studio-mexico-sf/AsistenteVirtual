/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

require('dotenv').config({ silent: true })
const path = require('path'); // path
let multer = require('multer');
let upload = multer();

const express = require('express'); // app server
const bodyParser = require('body-parser'); // parser for post requests
const numeral = require('numeral');
const fs = require('fs'); // file system for loading JSON
//const AssistantV2 = require('watson-developer-cloud/assistant/v2');
//const VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
/**Users Table*/
const User = require('./src/db/User');
const uuidv4 = require('uuid/v4');
/**Variables de asistente*/
const versionAV2 = process.env.ASSISTANT_V2_REVISION;
const apiAV2 = process.env.ASSISTANT_V2_URL;
const apikey = process.env.ASSISTANT_APIKEY;
const defaultIdAV2 = process.env.DEFAULT_ASSISTANT_ID
const debuggerLevel = process.env.LOGLEVEL
const apiUrl=process.env.ASSISTANT_V2_URL

const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

/**Configuracion de la conexion al API del asistente*/

const assistant = new AssistantV2({
    version:versionAV2,
    authenticator: new IamAuthenticator({
        apikey: apikey,
    }),
    url: apiUrl,
    disableSslVerification: true,
});

const userInstance = new User();

const app = express();
// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use('/libs/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/libs/popper', express.static(__dirname + '/node_modules/popper.js/dist/'));
app.use('/libs/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
app.use(bodyParser.json());

//return admin page
app.get('/watson/admin', function(requ, res) {
    res.sendFile(__dirname + '/src/admin/admin.html');
});

// setupError will be set to an error message if we cannot recover from service setup or init error.
let setupError = '';

/**call http://localhost:3000/api/session to test cyour connection*/
app.get('/api/session', function(request, response) {

 assistant.createSession({
      assistantId: '1ab31c38-3902-4f2a-b18f-49102e0ea5a2',
  })
  .then(res => {
    console.log(JSON.stringify(res.result, null, 2));
    response.status(200).json(JSON.stringify(res.result, null, 2));
  })
  .catch(err => {
    console.log('error',err);
    response.status(err.code || 500).json(err);
  });
    
});

/**run  http://{server}:{port}/api/session to delete sesion*/
app.delete('/api/session', function(req, res) {
    let data = req.body;
    let assistant_id = "";
    let session_id = "";
    let user_id = "";
    if (data.context &&
        data.context.assistant_id &&
        data.context.session_id &&
        data.context.global &&
        data.context.global.system &&
        data.context.global.system.user_id
    ) {
        assistant_id = data.context.assistant_id;
        session_id = data.context.session_id;
        user_id = data.context.global.system.user_id
    }
    console.log(assistant_id, session_id);
    if (!assistant_id || !session_id) {
        return res.status(500).json({ "errror": { "message": "session not exist" } });
    }

    assistant.deleteSession({
        assistant_id: assistant_id,
        session_id: session_id,
    }, function(err, response) {
        if (err) {
            console.error(err);
            return res.status(err.status | 500).json(err);
        } else {
            console.log(JSON.stringify(response, null, 2));
            userInstance.delete(user_id);
            return res.json({ status: 'ok' });
        }
    });
});

// Run from REST client in order to senda a message for Watson Assistant.
app.post('/api/message', function(req, res) {

    let id = uuidv4();
    var createSession = function(payload, callback) {
        console.log('createSession',JSON.stringify(payload, null, 2));
        assistant.createSession({
      		assistantId: defaultIdAV2,
		  })
		  .then(response => {
		    console.log('response',JSON.stringify(response.result, null, 2));
		    //response.status(200).json(JSON.stringify(res.result, null, 2));
		    if (response && response.result && response.result.session_id) {
                    //console.log(JSON.stringify(payload, null, 2));
                    payload.sessionId = response.result.session_id;
                    /**Guardar usuario en la base local la session */
                    userInstance.save(
                        payload.context.global.system.user_id,
                        payload.sessionId,
                        payload.assistantId
                    );
                    /**Termina el guardado*/
                    console.log('response paylod',JSON.stringify(payload, null, 2));
                    callback(payload);
                }
		  })
		  .catch(err => {
		    console.log('error response',err);
		    res.status(err.code || 500).json(err);
		  });
    }
    /**
     * Create the payload for Watson Assistant
     * @param callback funtion to execute after create the payload
     */
    var createPayLoad = function(callback) {
        const payload = {
            assistantId: defaultIdAV2,
            sessionId: '',
            input: {
                'message_type': 'text',
                'text': 'hola',
                'options': {
                    'return_context': true
                }
            },
            context: {
                global: {
                    system: {
                        user_id: id
                    }
                }
            }
        };
        if (req.body) {
            if (req.body.input) {
                payload.input.text = req.body.input.text;
            }
            if (req.body.context && req.body.context.global) {
                //Validar existencia del contexto
                payload.context = req.body.context;
                //validar el output_context
                if (req.body.context.output_context) {
                    payload.context.output_context = req.body.context.output_context;
                }
            }
            if (req.body.security_context) {
                if (req.body.security_context.session_id) {
                    payload.sessionId = req.body.security_context.session_id
                }
                if (req.body.security_context.assistant_id) {
                    payload.assistantId = req.body.security_context.assistant_id
                }
            }

        }
        /**Funcion de callback que se ejecutara despues de armar el payload*/
        if (payload.sessionId) {
            console.log("sesion existente");
            callback(payload);
        } else {
            console.log("creando sesion");
            createSession(payload, callback);
        }

    };
    /**
     * Send the input to the Assistant service.
     * @param payload
     */
    var callAssistant = function(payload) {
        const queryInput = JSON.stringify(payload.input);
        /**Invoke Assistanta and wait for the magic*/
        // console.log('assistant.request :: ', JSON.stringify(payload));
        assistant.message(payload)
		  .then(response => {
		    console.log(JSON.stringify(response.result, null, 2));
		    processResponseFromAssistant(response.result, function(err, data) {
                    if (err) {
                        console.log('processResponseFromAssistant.err :: ', JSON.stringify(data));
                        return res.status(err.code || 500).json(err);
                    } else {
                        // console.log('processResponseFromAssistant.data :: ', JSON.stringify(data));
                        return res.json(data);
                    }
                })
		  })
		  .catch(err => {
		    console.log(err);
		    res.status(err.code || 500).json(err);
		  });
    }

    /**Create de payLoad a do the magic*/
    createPayLoad(callAssistant);
});

function Generator() {};
Generator.prototype.rand = Math.floor(Math.random() * 26) + Date.now();
Generator.prototype.getId = function() {
    return this.rand++;
};
let GenUUID = new Generator();
/**
 * Manage the response from Watson assistant
 */
var processResponseFromAssistant = async function(data, callback) {

    if (data.context) {
        let payloadToFront = {
            context: data.context,
            input: data.input,
            output: data.output
        };
        /**Inyectamos al contexto del response el assistant_id y la session asociada*/
        if (data.context &&
            data.context.global &&
            data.context.global.system &&
            data.context.global.system.user_id
        ) {
            let dbUser = await userInstance.findByUserId(data.context.global.system.user_id);
            console.log("Data ", dbUser);
            payloadToFront.security_context = {};
            payloadToFront.security_context.session_id = dbUser.session_id;
            payloadToFront.security_context.assistant_id = dbUser.assistant_id;
            payloadToFront.security_context.user_id = dbUser.id;
        }
        if (data.context && data.context.output_context) {
            payloadToFront.output_context = data.context.output_context
        }
        /**Limpiar el otputContext para evitar repetirlo*/
        if (payloadToFront.context.output_context) {
            payloadToFront.context.output_context = undefined;
        }
        console.log('payloadToFront :: ', JSON.stringify(payloadToFront));
        callback(null, payloadToFront);
        return;
    } else {
        console.log('Not Context data :: ', JSON.stringify(data));
        callback(null, data);
        return;
    }
}
/**
 * Handle setup errors by logging and appending to the global error text.
 * @param {String} reason - The error message for the setup error.
 */
function handleSetupError(reason) {
    setupError += ' ' + reason;
    console.error('The app failed to initialize properly. Setup and restart needed.' + setupError);
    // We could allow our chatbot to run. It would just report the above error.
    // Or we can add the following 2 lines to abort on a setup error allowing Bluemix to restart it.
    console.error('\nAborting due to setup error!');
    process.exit(1);
}

module.exports = app;