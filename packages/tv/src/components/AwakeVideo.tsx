import { useEffect, useRef } from 'preact/hooks';
import '../styles/awake-video.css';

/** One new frame a second: enough for the browser to count the video as playing (TVAWAKE-01 AC 3). */
const FRAMES_PER_SECOND = 1;

/** The canvas and the video, in px: the smallest a browser still plays as a video. */
const VIDEO_SIZE_PX = 2;

/**
 * A muted video that loops in a corner, out of sight, so a TV that sleeps without playing media stays on (TVAWAKE-01
 * AC 3). Its source is a stream of a canvas painted in the page's background color, so no video file ships with the
 * game; it sits behind the page and its frames are the color of the page, so nothing the players see changes
 * (TVAWAKE-01 AC 5). A browser without the stream, or one that refuses to play, is logged and the game goes on
 * (TVAWAKE-01 AC 4).
 */
export function AwakeVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;
    const canvas = document.createElement('canvas');
    canvas.width = VIDEO_SIZE_PX;
    canvas.height = VIDEO_SIZE_PX;
    const context = canvas.getContext('2d');
    if (context === null || typeof canvas.captureStream !== 'function') {
      console.warn('This browser cannot stream a canvas; the TV plays no video to stay awake');
      return;
    }
    const paint = () => {
      context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-background');
      context.fillRect(0, 0, VIDEO_SIZE_PX, VIDEO_SIZE_PX);
    };
    paint();
    const stream = canvas.captureStream(FRAMES_PER_SECOND);
    video.srcObject = stream;
    video.play().catch((error: unknown) => console.warn('The browser refused to play the video that keeps the TV awake', error));
    // A canvas stream sends a frame only after the canvas is painted again.
    const repaint = setInterval(paint, 1000 / FRAMES_PER_SECOND);
    return () => {
      clearInterval(repaint);
      video.srcObject = null;
      for (const track of stream.getTracks()) track.stop();
    };
  }, []);

  return <video ref={videoRef} class="awake-video" muted loop playsInline autoplay aria-hidden="true" data-testid="awake-video" />;
}
