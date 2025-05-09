import React from 'react';
import { IconButton, Box, Typography } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';

const ControlContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StyledIconButton = styled(IconButton)`
  background-color: ${({ theme }) => theme.primary} !important;
  color: white !important;
  &:hover {
    transform: scale(1.1);
  }
`;

interface AudioControlsProps {
    showLabel?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const AudioControls: React.FC<AudioControlsProps> = ({
    showLabel = false,
    size = 'medium'
}) => {
    const { isPlaying, play, pause, togglePlay } = useAudio();

    const buttonSize = {
        small: { width: 30, height: 30 },
        medium: { width: 40, height: 40 },
        large: { width: 50, height: 50 },
    }[size];

    return (
        <ControlContainer>
            <StyledIconButton
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                style={buttonSize}
            >
                {isPlaying ? <Pause /> : <PlayArrow />}
            </StyledIconButton>

            {showLabel && (
                <Typography variant="body2">
                    {isPlaying ? 'Now Playing' : 'Paused'}
                </Typography>
            )}
        </ControlContainer>
    );
};

export default AudioControls; 