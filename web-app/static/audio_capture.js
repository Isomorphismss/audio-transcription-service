let mediaRecorder;
let audioChunks = [];

document.getElementById("start-recording").addEventListener("click", async () => {
    console.log("Start recording button clicked");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.start();
    document.getElementById("stop-recording").disabled = false;

    document.getElementById("stop-recording").addEventListener("click", () => {
        console.log("Stop recording button clicked");
        mediaRecorder.stop();
        document.getElementById("stop-recording").disabled = true;
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            sendAudioToServer(audioBlob);
            console.log("Recording stopped");
        };
    });
});

function sendAudioToServer(audioBlob) {
    console.log("Sending audio to server");
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    fetch("/api/js_upload_audio", {
        method: "POST",
        body: formData
    })
    .then(async response => {
        if (!response.ok) {
            const error_body = await response.json();
            console.log(error_body);
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log("Upload successful", data);
        updateResultPage(data); 
    })
    .catch(error => {
        console.error("Error uploading audio:", error);
    });
}

function updateResultPage(data) {
    const resultContainer = document.getElementById("response-message");
    resultContainer.innerHTML = `
        <div>
            <h3>Transcribed Text:</h3>
            <p>${data.transcript || 'No transcription available.'}</p>
        </div>
        <div>
            <h3>Sentiment Analysis:</h3>
            <p>${data.sentiment || 'No sentiment data.'}</p>
        </div>
    `;
    if (data.filename) {
        resultContainer.innerHTML += `
            <div>
                <h3>Listen to the Audio:</h3>
                <audio controls>
                    <source src="http://127.0.0.1:7001/audio/${data.filename}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    }
}