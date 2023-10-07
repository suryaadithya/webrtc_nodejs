const socket = io();
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const pc = new RTCPeerConnection(configuration);
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
        socket.emit('signal', roomId, { type: 'ice-candidate', candidate });
    }
};

pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

function joinRoom() {
    roomId = document.getElementById('roomInput').value;
    socket.emit('join-room', roomId);
}

socket.on('joined-room', (roomId) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.createOffer().then(offer => pc.setLocalDescription(offer)).then(() => {
            socket.emit('signal', roomId, { type: 'offer', offer: pc.localDescription });
        });
    });
});

socket.on('created-room', () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
    });
});

socket.on('signal', (fromId, message) => {
    if (message.type === 'offer') {
        const remoteOffer = new RTCSessionDescription(message.offer);
        pc.setRemoteDescription(remoteOffer).then(() => {
            return pc.createAnswer();
        }).then(answer => {
            return pc.setLocalDescription(answer);
        }).then(() => {
            socket.emit('signal', fromId, { type: 'answer', answer: pc.localDescription });
        });
    } else if (message.type === 'answer') {
        const remoteAnswer = new RTCSessionDescription(message.answer);
        pc.setRemoteDescription(remoteAnswer);
    } else if (message.type === 'ice-candidate') {
        if (message.candidate) {
            pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }
});
