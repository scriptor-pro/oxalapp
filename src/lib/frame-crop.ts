interface VideoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Maps the on-screen guide frame to a crop rectangle in the video's native
// pixel space, accounting for `object-fit: cover` scaling the video to fill
// its container (cropping whichever axis overflows). Without this, the OCR
// sees the full camera frame — logos, nutrition table, legal text — instead
// of just what the user framed.
export function getFrameCropInVideoSpace(
  video: HTMLVideoElement,
  frame: HTMLElement | null
): VideoCrop {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const container = video.parentElement;
  if (!frame || !container || videoWidth === 0 || videoHeight === 0) {
    return { x: 0, y: 0, width: videoWidth, height: videoHeight };
  }

  const containerRect = container.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  if (containerRect.width === 0 || containerRect.height === 0) {
    return { x: 0, y: 0, width: videoWidth, height: videoHeight };
  }

  // `object-fit: cover`: the video scales uniformly to cover the container,
  // so the effective scale is the larger of the two axis ratios.
  const scale = Math.max(
    containerRect.width / videoWidth,
    containerRect.height / videoHeight
  );
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (renderedWidth - containerRect.width) / 2;
  const offsetY = (renderedHeight - containerRect.height) / 2;

  const x = (frameRect.left - containerRect.left + offsetX) / scale;
  const y = (frameRect.top - containerRect.top + offsetY) / scale;
  const width = frameRect.width / scale;
  const height = frameRect.height / scale;

  return {
    x: Math.max(0, Math.min(x, videoWidth)),
    y: Math.max(0, Math.min(y, videoHeight)),
    width: Math.max(1, Math.min(width, videoWidth - x)),
    height: Math.max(1, Math.min(height, videoHeight - y)),
  };
}
