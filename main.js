const API_KEY = 'AIzaSyBUiImEhXHNG4huchqrTHB5-YORsaNs0e4';

const videos = [
    { src: 'VDXeaTnSBUE' },
    { src: 'aJgnXwpEWso' },
    { src: 'eTylF8r7Yf4' }
];

// Global variable for YouTube player
let player;
let isPlaying = false;
let videoIndex = 0;

// Select DOM elements
const videoElement = document.getElementById('video');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const volumeSlider = document.getElementById('volume');
const speedSelect = document.getElementById('speed');
const progressBar = document.querySelector('.progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// Fetch video details from YouTube
async function fetchVideoDetails() {
    for (let video of videos) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${video.src}&key=${API_KEY}`);
            const data = await response.json();
            if (data.items && data.items[0]) {
                const snippet = data.items[0].snippet;
                video.title = snippet.title;
                video.artist = snippet.channelTitle;
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
            video.title = 'Video Title Unavailable';
            video.artist = 'Unknown Artist';
        }
    }
    // Load first video after fetching details
    loadVideo(videos[0]);
}

// Set initial video source
videoElement.src = `https://www.youtube.com/embed/${videos[0].src}?enablejsapi=1&controls=0&modestbranding=1`;

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Initialize player after API loads
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('video', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

// Player Ready Event
function onPlayerReady(event) {
    // Fetch video details first
    fetchVideoDetails();
    
    // Set up volume control
    volumeSlider.addEventListener('input', () => {
        player.setVolume(volumeSlider.value * 100);
    });

    // Set up playback speed
    speedSelect.addEventListener('change', () => {
        player.setPlaybackRate(parseFloat(speedSelect.value));
    });

    // Update progress bar
    setInterval(updateProgress, 1000);
}

// Player State Change Event
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        nextVideo();
    } else if (event.data === YT.PlayerState.PLAYING) {
        playBtn.querySelector('i').classList.replace('fa-play', 'fa-pause');
        isPlaying = true;
    } else if (event.data === YT.PlayerState.PAUSED) {
        playBtn.querySelector('i').classList.replace('fa-pause', 'fa-play');
        isPlaying = false;
    }
}

// Load video details
function loadVideo(video) {
    title.textContent = video.title;
    artist.textContent = video.artist;
    if (player && player.loadVideoById) {
        player.loadVideoById(video.src);
    } else {
        videoElement.src = `https://www.youtube.com/embed/${video.src}?enablejsapi=1&controls=0&modestbranding=1`;
    }
}

// Play/Pause functionality
function playVideo() {
    if (player && player.playVideo) {
        player.playVideo();
    }
}

function pauseVideo() {
    if (player && player.pauseVideo) {
        player.pauseVideo();
    }
}

// Previous video
function prevVideo() {
    videoIndex = (videoIndex - 1 + videos.length) % videos.length;
    loadVideo(videos[videoIndex]);
}

// Next video
function nextVideo() {
    videoIndex = (videoIndex + 1) % videos.length;
    loadVideo(videos[videoIndex]);
}

// Update progress bar and time
function updateProgress() {
    if (player && player.getCurrentTime && player.getDuration) {
        const currentTime = player.getCurrentTime() || 0;
        const duration = player.getDuration() || 0;
        const progress = (currentTime / duration) * 100;
        
        progressBar.style.width = `${progress}%`;
        
        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
    }
}

// Format time in minutes:seconds
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Click on progress bar to seek
document.querySelector('.progress-bar').addEventListener('click', (e) => {
    if (player && player.getDuration) {
        const progressBar = e.currentTarget;
        const clickPosition = e.offsetX / progressBar.offsetWidth;
        const seekTime = clickPosition * player.getDuration();
        player.seekTo(seekTime);
    }
});

// Event listeners
playBtn.addEventListener('click', () => isPlaying ? pauseVideo() : playVideo());
prevBtn.addEventListener('click', prevVideo);
nextBtn.addEventListener('click', nextVideo);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            isPlaying ? pauseVideo() : playVideo();
            break;
        case 'arrowright':
            nextVideo();
            break;
        case 'arrowleft':
            prevVideo();
            break;
        case 'm':
            if (player && player.getVolume && player.setVolume) {
                const currentVolume = player.getVolume();
                player.setVolume(currentVolume === 0 ? 100 : 0);
                volumeSlider.value = currentVolume === 0 ? 1 : 0;
            }
            break;
    }
});
