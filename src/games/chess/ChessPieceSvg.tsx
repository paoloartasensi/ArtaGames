import React from 'react';
import { ChessPiece } from './chessEngine';

interface ChessPieceSvgProps {
  piece: ChessPiece;
  className?: string;
}

export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({ piece, className = 'w-full h-full' }) => {
  const isWhite = piece.color === 'w';

  // Crisp visual contrast for White and Black pieces
  const mainFill = isWhite ? '#ffffff' : '#27272a';
  const strokeColor = isWhite ? '#18181b' : '#fafafa';
  const detailStroke = isWhite ? '#18181b' : '#fafafa';

  // Common stroke attributes
  const strokeProps = {
    stroke: strokeColor,
    strokeWidth: '1.6',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const detailProps = {
    stroke: detailStroke,
    strokeWidth: '1.2',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  const renderPiecePath = () => {
    switch (piece.type) {
      case 'p': // Pawn - Identical geometry for White and Black
        return (
          <g fill={mainFill} {...strokeProps}>
            {/* Base platform */}
            <path d="M 9.5 39.5 L 35.5 39.5 C 36.5 39.5 36.5 42 35.5 42 L 9.5 42 C 8.5 42 8.5 39.5 9.5 39.5 Z" />
            <path d="M 12 36.5 L 33 36.5 C 34 36.5 34.5 38.5 33 39.5 L 12 39.5 C 10.5 38.5 11 36.5 12 36.5 Z" />
            {/* Body */}
            <path d="m 22.5 9 c -2.21 0 -4 1.79 -4 4 c 0 0.89 0.29 1.71 0.78 2.38 C 17.33 16.5 16 18.59 16 21 c 0 2.03 0.94 3.84 2.41 5.03 C 15.41 27.09 11 31.58 11 36.5 l 23 0 c 0 -4.92 -4.41 -9.41 -7.41 -10.47 C 28.06 24.84 29 23.03 29 21 c 0 -2.41 -1.33 -4.5 -3.28 -5.62 C 26.21 14.71 26.5 13.89 26.5 13 c 0 -2.21 -1.79 -4 -4 -4 z" />
            {/* Subtle neck & collar detail */}
            <path d="M 17 21 C 20 22.5 25 22.5 28 21" {...detailProps} />
            <path d="M 15.5 27 C 19 28.8 26 28.8 29.5 27" {...detailProps} />
          </g>
        );

      case 'r': // Rook / Castle
        return (
          <g fill={mainFill} {...strokeProps}>
            <path d="M 9.5 39.5 L 35.5 39.5 C 36.5 39.5 36.5 42 35.5 42 L 9.5 42 C 8.5 42 8.5 39.5 9.5 39.5 Z" />
            <path d="M 12 36.5 L 33 36.5 L 33 39.5 L 12 39.5 Z" />
            {/* Tower shaft */}
            <path d="M 14 36.5 L 15.5 17 L 29.5 17 L 31 36.5 Z" />
            {/* Parapet & 3 Crenels */}
            <path d="M 11 17 L 34 17 L 34 9.5 L 29.5 9.5 L 29.5 13 L 25 13 L 25 9.5 L 20 9.5 L 20 13 L 15.5 13 L 15.5 9.5 L 11 9.5 Z" />
            {/* Accent lines */}
            <path d="M 14 17 L 31 17" {...detailProps} />
            <path d="M 13 36.5 L 32 36.5" {...detailProps} />
          </g>
        );

      case 'n': // Knight / Horse
        return (
          <g fill={mainFill} {...strokeProps}>
            <path d="M 9.5 39.5 L 35.5 39.5 C 36.5 39.5 36.5 42 35.5 42 L 9.5 42 C 8.5 42 8.5 39.5 9.5 39.5 Z" />
            {/* Knight silhouette */}
            <path d="M 22 10 C 22 10 20 7.5 14.5 11.5 C 9.5 15.5 9 20.5 11 25.5 C 11.8 27.2 13 28 14 28 C 15 28 15.5 27 15 25.5 C 14.2 24 13.8 22.5 14 21 C 14.5 19 16 18.5 17.5 19.5 C 18.5 20.5 18.5 23 20.5 24 C 22 25 23 25 24 27 C 25.5 29.5 25 32 23 34.5 C 21 37 18 37.5 12 38.5 L 33 38.5 C 33 34 32.5 29 31 24.5 C 29.5 20 27.5 14.5 22 10 Z" />
            {/* Eye */}
            <circle cx="15" cy="17.5" r="1.3" fill={strokeColor} stroke="none" />
            {/* Mane & Snout Lines */}
            <path d="M 11.5 24 C 13 24 13.5 23 13.5 23" {...detailProps} />
            <path d="M 20 12 C 22 14.5 24 17 24.5 20" {...detailProps} />
          </g>
        );

      case 'b': // Bishop
        return (
          <g fill={mainFill} {...strokeProps}>
            <path d="M 9.5 39.5 L 35.5 39.5 C 36.5 39.5 36.5 42 35.5 42 L 9.5 42 C 8.5 42 8.5 39.5 9.5 39.5 Z" />
            <path d="M 12 36.5 L 33 36.5 C 34 36.5 34.5 38.5 33 39.5 L 12 39.5 C 10.5 38.5 11 36.5 12 36.5 Z" />
            {/* Mitre body */}
            <path d="M 22.5 8.5 C 17.5 8.5 14 13.5 14 19.5 C 14 25.5 17.5 31 17.5 34.5 L 27.5 34.5 C 27.5 31 31 25.5 31 19.5 C 31 13.5 27.5 8.5 22.5 8.5 Z" />
            {/* Pommel circle */}
            <circle cx="22.5" cy="6" r="2.2" />
            {/* Bishop cross slit */}
            <path d="M 20 15 L 25.5 23" {...detailProps} />
            <path d="M 22.5 13 L 22.5 19" {...detailProps} />
            <path d="M 19.5 16 L 25.5 16" {...detailProps} />
            <path d="M 16.5 34.5 C 20 36 25 36 28.5 34.5" {...detailProps} />
          </g>
        );

      case 'q': // Queen
        return (
          <g fill={mainFill} {...strokeProps}>
            <path d="M 9.5 39.5 L 35.5 39.5 C 36.5 39.5 36.5 42 35.5 42 L 9.5 42 C 8.5 42 8.5 39.5 9.5 39.5 Z" />
            <path d="M 12 36.5 L 33 36.5 C 34 36.5 34.5 38.5 33 39.5 L 12 39.5 C 10.5 38.5 11 36.5 12 36.5 Z" />
            {/* Queen Crown robe */}
            <path d="M 9 14.5 L 12.5 24 L 15 11 L 18.5 24 L 22.5 9 L 26.5 24 L 30 11 L 32.5 24 L 36 14.5 C 33 27 30 33 28 35.5 L 17 35.5 C 15 33 12 27 9 14.5 Z" />
            {/* 5 Crown globes */}
            <circle cx="9" cy="13.5" r="1.6" />
            <circle cx="15" cy="10" r="1.6" />
            <circle cx="22.5" cy="8" r="1.8" />
            <circle cx="30" cy="10" r="1.6" />
            <circle cx="36" cy="13.5" r="1.6" />
            {/* Waist trim */}
            <path d="M 13 28 C 18 30.5 27 30.5 32 28" {...detailProps} />
          </g>
        );

      case 'k': // King
        return (
          <g fill={mainFill} {...strokeProps}>
            <path d="M 9.5 39.5 L 35.5 39.5 C 36.5 39.5 36.5 42 35.5 42 L 9.5 42 C 8.5 42 8.5 39.5 9.5 39.5 Z" />
            <path d="M 12 36.5 L 33 36.5 C 34 36.5 34.5 38.5 33 39.5 L 12 39.5 C 10.5 38.5 11 36.5 12 36.5 Z" />
            {/* King Robe & Arched Crown */}
            <path d="M 16 13 C 18 11.5 20.5 12 22.5 13.5 C 24.5 12 27 11.5 29 13 C 31.5 18 32 25 29 30 C 28 32.5 27 34.5 27 35.5 L 18 35.5 C 18 34.5 17 32.5 16 30 C 13 25 13.5 18 16 13 Z" />
            {/* Latin Cross on Crown */}
            <path d="M 22.5 4.5 L 22.5 11 M 19.5 7.5 L 25.5 7.5" stroke={strokeColor} strokeWidth="2" strokeLinecap="square" />
            {/* Regal collar bands */}
            <path d="M 15 22 C 19 24.5 26 24.5 30 22" {...detailProps} />
            <path d="M 15.5 28 C 19 30 26 30 29.5 28" {...detailProps} />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} drop-shadow-md transition-transform`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderPiecePath()}
    </svg>
  );
};
