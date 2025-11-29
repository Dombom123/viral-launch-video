import * as PIXI from "pixi.js";
import type { Timeline, TimelineItemOverlay, TimelineItemVideo } from "./types";

export interface PixiEditorContext {
	app: PIXI.Application;
	videoContainer: PIXI.Container;
	overlayContainer: PIXI.Container;
	videoSprite: PIXI.Sprite | null;
	currentVideoSrc: string | null;
	videoElements: Map<string, HTMLVideoElement>;
	timeline: Timeline;
}

export class PixiEditor {
	private app: PIXI.Application;

	public getApp() {
		return this.app;
	}

	private videoContainer: PIXI.Container;
	private overlayContainer: PIXI.Container;
	private videoElements: Map<
		string,
		{ video: HTMLVideoElement; texture: PIXI.Texture }
	> = new Map();

	public getVideoElements() {
		return this.videoElements;
	}

	private videoSprite: PIXI.Sprite | null = null;
	private currentVideoSrc: string | null = null;
	private timeline: Timeline;

	public getTimeline() {
		return this.timeline;
	}

	private lastUpdatedTime: number = 0;

	constructor(app: PIXI.Application, timeline: Timeline) {
		this.app = app;
		this.timeline = timeline;

		// Initialize containers
		this.videoContainer = new PIXI.Container();
		this.overlayContainer = new PIXI.Container();
		this.app.stage.addChild(this.videoContainer);
		this.app.stage.addChild(this.overlayContainer);

		// Preload video elements
		this.initVideoElements();
	}

	private async initVideoElements() {
		for (const item of this.timeline.items) {
			if (item.type !== "video" || this.videoElements.has(item.src)) continue;

			const asset = await PIXI.Assets.load({
				src: item.src,
				parser: "loadVideo",
			});
			const video = asset.source as PIXI.VideoSource;
			video.resource.muted = false;

			this.videoElements.set(item.src, {
				texture: asset,
				video: video.resource,
			});
		}
	}

	public update(
		currentTime: number,
		isPlaying: boolean,
		wasSeeked: boolean,
		force: boolean = false,
	) {
		if (!force && currentTime === this.lastUpdatedTime) return;
		this.lastUpdatedTime = currentTime;
		this.handleVideoRendering(currentTime, isPlaying, wasSeeked);
		this.handleOverlays(currentTime);
	}

	private findActiveVideoItem(currentTime: number) {
		let activeVideoItem: TimelineItemVideo | undefined;
		for (const item of this.timeline.items) {
			if (item.type !== "video") continue;
			if (
				currentTime >= item.startTime &&
				currentTime < item.startTime + item.duration
			) {
				activeVideoItem = item;
				break;
			} else {
				const videoEl = this.videoElements.get(item.src);
				if (videoEl && !videoEl.video.paused) {
					videoEl.video.pause();
				}
			}
		}
		return activeVideoItem;
	}

	private async handleVideoRendering(
		currentTime: number,
		isPlaying: boolean,
		wasSeeked: boolean,
	) {
		const activeVideoItem = this.findActiveVideoItem(currentTime);

		if (activeVideoItem) {
			const videoEl = this.videoElements.get(activeVideoItem.src);
			if (videoEl) {
				// Calculate relative time in the video
				const relativeTime = currentTime - activeVideoItem.startTime;

				// Sync video time if it's significantly off (e.g. seeking)
				if (wasSeeked) {
					console.log(
						"syncing video time",
						videoEl.video.currentTime,
						relativeTime,
					);
					videoEl.video.currentTime = relativeTime;
				}

				// Play/Pause sync
				if (isPlaying) {
					if (videoEl.video.paused) videoEl.video.play().catch(() => {});
				} else {
					videoEl.video.pause();
				}

				// Render texture
				if (this.currentVideoSrc !== activeVideoItem.src) {
					// Switch texture
					if (this.videoSprite) {
						this.videoContainer.removeChild(this.videoSprite);
					}

					// In PixiJS v8, we can create a texture source from the video element
					// and then create a texture from that source.
					// PixiJS v8 automatically handles video textures better, but we ensure explicit handling here.
					const sprite = new PIXI.Sprite(videoEl.texture);

					// Fit to screen (contain) - simple scaling for now
					// We might need to wait for metadata to load for correct dimensions
					// But since we preload, it might be ready.
					// If 0, fallback to screen size or 1
					const vWidth = videoEl.video.videoWidth || this.app.screen.width;
					const vHeight = videoEl.video.videoHeight || this.app.screen.height;

					const scale = Math.min(
						this.app.screen.width / vWidth,
						this.app.screen.height / vHeight,
					);

					sprite.setSize(vWidth * scale, vHeight * scale);

					// Center sprite
					sprite.anchor.set(0.5);
					sprite.x = this.app.screen.width / 2;
					sprite.y = this.app.screen.height / 2;

					// sprite.x = 0;
					// sprite.y = 0;

					this.videoContainer.addChild(sprite);
					this.videoSprite = sprite;
					this.currentVideoSrc = activeVideoItem.src;
				}
			}
		} else {
			// No active video (black screen or pause all)
			if (this.videoSprite) {
				this.videoContainer.removeChild(this.videoSprite);
				this.videoSprite = null;
				this.currentVideoSrc = null;
			}
			// Pause all videos
			this.videoElements.forEach((v) => {
				if (!v.video.paused) v.video.pause();
			});
		}
	}

	private handleOverlays(currentTime: number) {
		// Clear previous frame overlays
		// In a more optimized version, we would diff updates instead of clearing
		this.overlayContainer.removeChildren();

		const activeOverlays = this.timeline.items.filter(
			(item) =>
				item.type === "overlay" &&
				currentTime >= item.startTime &&
				currentTime < item.startTime + item.duration,
		) as TimelineItemOverlay[];

		activeOverlays.forEach((overlayItem) => {
			overlayItem.layout.forEach((element) => {
				if (element.type === "text") {
					const style = new PIXI.TextStyle({
						fontFamily: "Geist",
						fontWeight: "bold",
						fontSize:
							element.size === "large"
								? 120
								: element.size === "medium"
									? 64
									: 48,
						fill: element.color,
						wordWrap: true,
						wordWrapWidth: this.app.screen.width,
						align: "center",
					});

					const text = new PIXI.Text({ text: element.text, style });
					text.resolution = 4;
					text.anchor.set(0.5);

					// Position
					text.x = this.app.screen.width / 2;
					if (element.position === "top") text.y = 100;
					else if (element.position === "bottom")
						text.y = this.app.screen.height - 100;
					else text.y = this.app.screen.height / 2;

					this.overlayContainer.addChild(text);
				}
				// Handle image overlays if needed later
			});
		});
	}

	public updateTimeline(timeline: Timeline) {
		this.timeline = timeline;
		this.initVideoElements();
	}

	public destroy() {
		this.videoElements.forEach((v) => {
			v.video.pause();
			v.video.src = "";
			v.video.load();
		});
		this.videoElements.clear();

		// Pixi App destroy is handled by the React component typically,
		// but we can clean up our containers if needed.
		this.videoContainer.destroy({ children: true });
		this.overlayContainer.destroy({ children: true });
	}
}
