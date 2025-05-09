import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import FavoriteIcon from '@mui/icons-material/Favorite';
import { CircularProgress, IconButton } from '@mui/material';
import { favoritePodcast, getPodcastById, getUsers } from '../api';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Episodecard from '../components/Episodecard';
import { openSnackbar } from '../redux/snackbarSlice';
import Avatar from '@mui/material/Avatar';
import { format } from 'timeago.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import { RootState } from "../redux/store";
import { User } from '../redux/userSlice';
import { openPlayer } from '../redux/audioplayerSlice';
import { useAudio } from '../context/AudioContext';
import AudioControls from '../components/AudioControls';

const Container = styled.div`
padding: 20px 30px;
padding-bottom: 200px;
height: 100%;
overflow-y: scroll;
display: flex;
flex-direction: column;
gap: 20px;
`;

const Top = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  @media (max-width: 768px) {
    flex-direction: column; 
  }
`;

const Image = styled.img`
  width: 250px;
  height: 250px;
  border-radius: 6px;
  background-color: ${({ theme }) => theme.text_secondary};
  object-fit: cover;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const Title = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: ${({ theme }) => theme.text_primary};
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const Description = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_secondary};
`;

const Tags = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-wrap: wrap;
`;

const Tag = styled.div`
  background-color: ${({ theme }) => theme.text_secondary + 50};
  color: ${({ theme }) => theme.text_primary};
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  `;


const Episodes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Topic = styled.div`
  color: ${({ theme }) => theme.text_primary};
  font-size: 22px;
  font-weight: 540;
  display: flex;
  justify-content space-between;
  align-items: center;
`;

const EpisodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;


const Favorite = styled(IconButton)`
  color:white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.text_secondary + 95} !important;
  color: ${({ theme }) => theme.text_primary} !important;
`

const Loader = styled.div`
display: flex;
justify-content: center;
align-items: center;
height: 100%;
width: 100%;
`
const Creator = styled.div`
color: ${({ theme }) => theme.text_secondary};
font-size: 12px;
`
const CreatorContainer = styled.div`
display: flex;
flex-direction: row;
align-items: center;
`
const CreatorDetails = styled.div`
display: flex;
flex-direction: row;
align-items: center;
gap: 8px;
`
const Views = styled.div`
color: ${({ theme }) => theme.text_secondary};
font-size: 12px;
margin-left: 20px;
`
const Icon = styled.div`
color: white;
font-size: 12px;
margin-left: 20px;
border-radius: 50%;
background: #9000ff !important;
display: flex;
align-items: center;
justify-content: center;
padding: 6px;
`

// Add interface after imports
interface Podcast {
  id: string;
  name: string;
  desc: string;
  thumbnail: string;
  type: string;
  views: number;
  creator: {
    name: string;
    img?: string;
  };
  tags: string[];
  episodes: any[];
  createdAt: string;
}

// Add a styled wrapper for the episode card
const CardWrapper = styled.div`
  position: relative;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: ${({ theme }) => theme.card + '50'};
    border-radius: 4px;
  }
`;

// Position the audio controls on the right side of the episode card
const ControlsWrapper = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

const PodcastDetails = () => {

  const { id } = useParams();
  const [favourite, setFavourite] = useState(false);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  const dispatch = useDispatch();

  // Get current audio player state from Redux
  const { openPlayer: openplayer, episode: currentEpisode } = useSelector((state: RootState) => state.audioplayer);

  // Get audio control methods from the context
  const { isPlaying, play, pause } = useAudio();

  const token = localStorage.getItem("podstreamtoken");
  //user
  const { currentUser } = useSelector((state: RootState) => state.user);

  const favoritpodcast = async () => {
    setLoading(true);
    if (podcast !== null) {
      await favoritePodcast(podcast.id, token).then((res) => {
        if (res.status === 200) {
          setFavourite(!favourite)
          setLoading(false)
        }
      }
      ).catch((err: any) => {
        console.log(err)
        setLoading(false)
        dispatch(
          openSnackbar(
            {
              message: err.message,
              severity: "error"
            }
          )
        )
      })
    }
  }

  const getUser = async () => {
    setLoading(true)
    await getUsers(token).then((res) => {
      setUser(res.data)
      setLoading(false)
    }).then((err: any) => {
      console.log(err)
      setLoading(false)
      dispatch(
        openSnackbar(
          {
            message: err.message,
            severity: "error"
          }
        )
      )
    });
  }

  const getPodcast = async () => {

    setLoading(true)
    await getPodcastById(id).then((res) => {
      if (res.status === 200) {
        setPodcast(res.data)
        setLoading(false)
      }
    }
    ).catch((err: any) => {
      console.log(err)
      setLoading(false)
      dispatch(
        openSnackbar(
          {
            message: err.message,
            severity: "error"
          }
        )
      )
    })
  }


  useEffect(() => {
    getPodcast();
  }, [currentUser])

  useEffect(() => {
    //favorits is an array of objects in which each object has a podcast id match it to the current podcast id
    if (currentUser) {
      getUser();
    }
  }, [currentUser, podcast])

  const handleEpisodeClick = (episode, index) => {
    console.log("Episode clicked:", episode);
    console.log("Podcast:", podcast);
    console.log("Episode file URL:", episode?.file);
    console.log("Episode data structure:", JSON.stringify(episode, null, 2));

    if (!podcast || !episode) {
      dispatch(
        openSnackbar({
          message: "Cannot play episode. Missing data.",
          severity: "error"
        })
      );
      return;
    }

    try {
      setSelectedEpisodeId(episode.id);

      // If this episode is already loaded in the player
      if (openplayer && currentEpisode && currentEpisode.id === episode.id) {
        // Toggle play/pause
        if (isPlaying) {
          pause();
          dispatch(
            openSnackbar({
              message: "Paused: " + episode.name,
              severity: "info"
            })
          );
        } else {
          play();
          dispatch(
            openSnackbar({
              message: "Playing: " + episode.name,
              severity: "success"
            })
          );
        }
      } else {
        // Load a new episode
        dispatch(
          openPlayer({
            type: podcast.type || "audio",
            podid: podcast,
            index: index,
            currenttime: 0,
            episode: episode
          })
        );

        // Wait a moment for the audio to load, then play
        setTimeout(() => {
          play();
          dispatch(
            openSnackbar({
              message: "Playing: " + episode.name,
              severity: "success"
            })
          );
        }, 100);
      }
    } catch (error) {
      console.error("Error controlling playback:", error);
      dispatch(
        openSnackbar({
          message: "Error playing episode. See console for details.",
          severity: "error"
        })
      );
    }
  };

  // Check if an episode is currently selected
  const isEpisodeSelected = (episodeId) => {
    return openplayer && currentEpisode && currentEpisode.id === episodeId;
  };

  return (
    <Container>
      {loading ?
        <Loader>
          <CircularProgress />
        </Loader>
        :
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            {/* <Favorite onClick={() => favoritpodcast()}>
              {favourite ?
                <FavoriteIcon style={{ color: "#E30022", width: '16px', height: '16px' }}></FavoriteIcon>
                :
                <FavoriteIcon style={{ width: '16px', height: '16px' }}></FavoriteIcon>
              }
            </Favorite> */}
          </div>
          <Top>
            <Image src={podcast?.thumbnail} />
            <Details>
              <Title>{podcast?.name}
              </Title>
              <Description>{podcast?.desc}</Description>
              <Tags>
                {podcast?.tags.map((tag) => (
                  <Tag>{tag}</Tag>
                ))}
              </Tags>
              <CreatorContainer>
                <CreatorDetails>
                  <Avatar src={podcast?.creator?.img} sx={{ width: "26px", height: "26px" }}>{podcast?.creator?.name.charAt(0).toUpperCase()}</Avatar>
                  <Creator>{podcast?.creator?.name}</Creator>
                </CreatorDetails>
                <Views>• {podcast?.views} Views</Views>
                <Views>
                  • {podcast?.createdAt ? format(podcast?.createdAt) : ''}
                </Views>
                <Icon>
                  {podcast?.type === "audio" ?
                    <HeadphonesIcon />
                    :
                    <PlayArrowIcon />
                  }
                </Icon>
              </CreatorContainer>
            </Details>
          </Top>
          <Episodes>
            <Topic>All Episodes</Topic>
            <EpisodeWrapper>
              {podcast?.episodes.map((episode, index) => (
                <CardWrapper key={index} onClick={() => handleEpisodeClick(episode, index)}>
                  <Episodecard
                    episode={episode}
                    podid={podcast}
                    type={podcast.type}
                    user={user}
                    index={index}
                  />
                  <ControlsWrapper>
                    <AudioControls size="small" />
                  </ControlsWrapper>
                </CardWrapper>
              ))}
            </EpisodeWrapper>
          </Episodes>
        </>
      }
    </Container >
  )
}

export default PodcastDetails