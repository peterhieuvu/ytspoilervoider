// ==UserScript==
// @name         YouTubeSpoilerVoider
// @license      GPLv3
// @version      0.2.0
// @description  Hide youtube video durations
// @author       peterhieuvu
// @match        https://*.youtube.com/*
// @grant        none
// @source       https://github.com/peterhieuvu/ytspoilervoider/tree/main
// @updateUrl    https://raw.githubusercontent.com/peterhieuvu/ytspoilervoider/main/ytspoilervoider.user.js
// @downloadUrl  https://raw.githubusercontent.com/peterhieuvu/ytspoilervoider/main/ytspoilervoider.user.js
// ==/UserScript==

(function() {
    'use strict';

    const STYLED_KEY = 'ytspoilervoider-applied';
    const DECORATED_KEY = 'ytspoilervoider-decorated';
    const OBFUSCATED_KEY = 'ytspoilervoider-obfuscated';

    // TODO: make this configurable
    const CONF_KEEP_TIME_IN_URL = true; // store current video time in URL when seeking
    const CONF_HIDE_UPCOMING_STREAMS = true; // hide upcoming stream titles and thumbnails in live tab

    const applyStyles = () => {
        const style = document.createElement('style');
        const classesToHide = [
            // player classes
            '.ytp-progress-bar-container',
            '.ytp-time-separator',
            '.ytp-time-duration',
            '.ytd-thumbnail-overlay-time-status-renderer', // watch page side thumbnail times
            '.ytInlinePlayerControlsTimeDisplay',
            '.YtInlinePlayerControlsTimeDisplay', // discover page time display
            '.video-time',
        ];
        style.innerText = `${classesToHide.join(', ')} { display: none !important; }`;
        document.head.appendChild(style);

        console.log('[ytspoilervoider] applied styles');
        return true;
    }

    const hideUpcoming = () => {
        if (CONF_HIDE_UPCOMING_STREAMS) {
            const headings = document.querySelectorAll('#meta:has(#buttons:not(:empty)) #video-title');
            for (const heading of headings) {
                heading.textContent = '[Obfuscated by YTSpoilerVoider]'
            }
            console.log('[ytspoilervoider] hid upcoming streams');
        }
        return true;
    }

    const seekVideo = (amount) => {
        const video = document.querySelector('.html5-main-video');
        if (!video || !Number.isFinite(video.currentTime)) return;
        video.currentTime = video.currentTime + amount;

        if (CONF_KEEP_TIME_IN_URL) {
            const totalSecs = video.currentTime;
            const sec = parseInt(totalSecs % 60);
            const totalMin = parseInt(totalSecs / 60);
            const min = parseInt(totalMin % 60);
            const hr = parseInt(totalMin / 60)
            const url = URL.parse(window.location.href);
            url.searchParams.set("t", `${hr}h${min}m${sec}s`);
            history.replaceState(null, null, url.href);
        }
    };

    const createSeekComponent = (text, duration, container) => {
        const el = document.createElement('span');
        el.innerText = text;
        el.style.cursor = 'pointer';
        el.style.userSelect = 'none';
        el.style.webkitUserSelect = 'none';
        el.addEventListener('click', function () {
            seekVideo(duration);
        });

        el.style.marginLeft = '20px';
        container.appendChild(el);
    }

    const decorateVideoPlayer = () => {
        // if (!window.location.pathname.startsWith('/watch')) return true; // no need to decorate if we aren't watching a video

        const durationElement = document.querySelector('.ytp-time-duration');
        if (durationElement) {
            const container = durationElement.parentNode;

            createSeekComponent('-10 min', -600, container);
            createSeekComponent('-1 min', -60, container);
            createSeekComponent('+1 min', 60, container);
            createSeekComponent('+10 min', 600, container);

            console.log('[ytspoilervoider] applied decorations');
            return true;
        }
        return false;
    }

    // top level activation function to hide durations and decorate the player
    const activate = () => {
        if (!window[STYLED_KEY]) {
            window[STYLED_KEY] = applyStyles();
        }
        if (!window[DECORATED_KEY]) {
            window[DECORATED_KEY] = decorateVideoPlayer();
        }
        if (!window[OBFUSCATED_KEY]) {
            window[OBFUSCATED_KEY] = hideUpcoming();
        }

        if (window[STYLED_KEY] && window[DECORATED_KEY] && window[OBFUSCATED_KEY]) {
            console.log('[ytspoilervoider] success!');
            observer.disconnect(); // we have done all we need to do and can stop observing
        }
    };

    // attempt to activate the behavior on each document body subtree update until activate function succeeds
    const observer = new MutationObserver(activate);
    observer.observe(document.body, { childList: true, subtree: true });
})();

