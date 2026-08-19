"use client";

import { SCORE_OPTIONS } from "@/constants/scores";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/map-styles";
import type { MapStats } from "@/lib/stats";

const LOGICAL_WIDTH = 1600;
const PIXEL_RATIO = 2.4;
const HEADER_HEIGHT = 132;
const LEGEND_HEIGHT = 108;
const PADDING = 48;

interface ExportOptions {
  title: string;
  totalScore: string;
  visitedCountries: string;
  visitedRegions: string;
  legend: string;
  scoreLabels: Record<number, string>;
  fileName?: string;
}

export async function downloadMapPng(
  svg: SVGSVGElement,
  stats: MapStats,
  options: ExportOptions,
): Promise<void> {
  const mapWidth = LOGICAL_WIDTH - PADDING * 2;
  const mapHeight = Math.round((mapWidth * MAP_HEIGHT) / MAP_WIDTH);
  const cardHeight = HEADER_HEIGHT + mapHeight + LEGEND_HEIGHT + PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(LOGICAL_WIDTH * PIXEL_RATIO);
  canvas.height = Math.round(cardHeight * PIXEL_RATIO);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("canvas");
  }

  context.scale(PIXEL_RATIO, PIXEL_RATIO);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  roundRect(context, 0, 0, LOGICAL_WIDTH, cardHeight, 28);
  context.fillStyle = "#f8fafc";
  context.fill();

  context.fillStyle = "#0f172a";
  context.font = "700 42px 'Noto Sans JP', system-ui, sans-serif";
  context.fillText(options.title, PADDING, 58);

  drawStatChip(
    context,
    PADDING,
    74,
    options.totalScore,
    String(stats.totalScore),
  );
  drawStatChip(
    context,
    PADDING + 250,
    74,
    options.visitedCountries,
    String(stats.visitedCount),
  );
  drawStatChip(
    context,
    PADDING + 500,
    74,
    options.visitedRegions,
    String(stats.visitedRegionCount),
  );

  const mapX = PADDING;
  const mapY = HEADER_HEIGHT;
  roundRect(context, mapX, mapY, mapWidth, mapHeight, 18);
  context.fillStyle = "#dbeafe";
  context.fill();
  context.save();
  roundRect(context, mapX, mapY, mapWidth, mapHeight, 18);
  context.clip();

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.removeAttribute("class");
  clone.setAttribute("width", String(Math.round(mapWidth * PIXEL_RATIO)));
  clone.setAttribute("height", String(Math.round(mapHeight * PIXEL_RATIO)));
  clone.style.backgroundColor = "#dbeafe";

  const worldGroup = clone.querySelector("g");
  if (worldGroup) {
    worldGroup.removeAttribute("transform");
  }

  clone.querySelectorAll("[vector-effect]").forEach((node) => {
    node.removeAttribute("vector-effect");
  });

  const viewScale = mapWidth / MAP_WIDTH;
  const countryStroke = (0.85 / viewScale).toFixed(3);
  const regionStroke = (0.45 / viewScale).toFixed(3);

  clone.querySelectorAll("[data-stroke]").forEach((node) => {
    const kind = node.getAttribute("data-stroke");
    node.setAttribute(
      "stroke-width",
      kind === "region" ? regionStroke : countryStroke,
    );
  });

  clone.querySelectorAll("[data-city-marker]").forEach((node) => {
    const x = node.getAttribute("data-x");
    const y = node.getAttribute("data-y");
    if (x && y) {
      node.setAttribute("transform", `translate(${x} ${y}) scale(1)`);
    }
  });

  const serialized = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
  const image = await loadImage(url);
  context.drawImage(image, mapX, mapY, mapWidth, mapHeight);
  context.restore();

  const legendY = mapY + mapHeight + 28;
  context.fillStyle = "#0f172a";
  context.font = "600 16px 'Noto Sans JP', system-ui, sans-serif";
  context.fillText(options.legend, PADDING, legendY);

  SCORE_OPTIONS.forEach((option, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = PADDING + col * 480;
    const y = legendY + 26 + row * 32;
    context.beginPath();
    context.arc(x + 8, y, 8, 0, Math.PI * 2);
    context.fillStyle = option.color;
    context.fill();
    context.strokeStyle = "#cbd5e1";
    context.lineWidth = 1;
    context.stroke();
    context.fillStyle = "#334155";
    context.font = "500 15px 'Noto Sans JP', system-ui, sans-serif";
    context.fillText(
      `${option.value}  ${options.scoreLabels[option.value] ?? ""}`,
      x + 24,
      y + 5,
    );
  });

  const link = document.createElement("a");
  link.download = options.fileName ?? "tabi-score.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function drawStatChip(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
) {
  roundRect(context, x, y, 230, 40, 10);
  context.fillStyle = "#ffffff";
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 1;
  context.stroke();
  context.fillStyle = "#64748b";
  context.font = "600 11px 'Noto Sans JP', system-ui, sans-serif";
  context.fillText(label.toUpperCase(), x + 12, y + 16);
  context.fillStyle = "#0f172a";
  context.font = "700 18px 'Noto Sans JP', system-ui, sans-serif";
  context.fillText(value, x + 12, y + 34);
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

export function openTwitterShare(text: string): void {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}
