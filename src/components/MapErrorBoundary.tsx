"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";

export class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Trip map failed to render", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <div className="map-fallback" role="status"><strong>地圖暫時無法載入</strong><p>下方點位與 Google Maps 連結仍可正常使用。</p></div>;
    }
    return this.props.children;
  }
}
