import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { getAllPodcasts, getMostPopularPodcast } from '../api/index';
import { getPodcastByCategory } from '../api';
import { PodcastCard } from '../components/PodcastCard'
import { getUsers } from '../api/index';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { RootState } from "../redux/store";

const DashboardMain = styled.div`
padding: 20px 30px;
padding-bottom: 200px;
height: 100%;
overflow-y: scroll;
display: flex;
flex-direction: column;
gap: 20px;
@media (max-width: 768px){
  padding: 6px 10px;
}
`;
const FilterContainer = styled.div`
display: flex;
flex-direction: column;
${({ box, theme }) => box && `
background-color: ${theme.bg};
  border-radius: 10px;
  padding: 20px 30px;
`}
background-color: ${({ theme }) => theme.bg};
  border-radius: 10px;
  padding: 20px 30px;
`;
const Topic = styled.div`
  color: ${({ theme }) => theme.text_primary};
  font-size: 24px;
  font-weight: 540;
  display: flex;
  justify-content: space-between;
  align-items: center;
  @maedia (max-width: 768px){
    font-size: 18px;
  }
`;
const Span = styled.span`
  color: ${({ theme }) => theme.text_secondary};
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  @media (max-width: 768px){
    font-size: 14px;
  }
  color: ${({ theme }) => theme.primary};
  &:hover{
    transition: 0.2s ease-in-out;
  }
  `;
const Podcasts = styled.div`
display: flex;
flex-wrap: wrap;
gap: 14px;
padding: 18px 6px;
//center the items if only one item present
@media (max-width: 550px){
  justify-content: center;
}
`;

const Loader = styled.div`
display: flex;
justify-content: center;
align-items: center;
height: 100%;
width: 100%;
`
const DisplayNo = styled.div`
display: flex;
justify-content: center;
align-items: center;
height: 100%;
width: 100%;
color: ${({ theme }) => theme.text_primary};
`

interface User {
  _id: string;
  name: string;
  email: string;
  img?: string;
  podcasts?: any[];
  favorits?: any[];
}

const Dashboard = ({ setSignInOpen }) => {
  const [allPodcasts, setAllPodcasts] = useState([]);
  const [user, setUser] = useState<User | null>(null);
  const [comedy, setComedy] = useState([]);
  const [news, setNews] = useState([]);
  const [sports, setsports] = useState([]);
  const [crime, setCrime] = useState([]);
  const [loading, setLoading] = useState(false);

  //user
  const { currentUser } = useSelector((state: RootState) => state.user);

  const token = localStorage.getItem("podstreamtoken");
  const getUser = async () => {
    await getUsers(token).then((res) => {
      setUser(res.data)
    }).then((error) => {
      console.log(error)
    });
  }

  const getAllPodcast = async () => {
    try {
      const res = await getAllPodcasts()
      setAllPodcasts(res.data)
      console.log(res.data)
    } catch (error: any) {
      console.log(error)
    }
  }

  // const getCommedyPodcasts = async () => {
  //   getPodcastByCategory("comedy")
  //     .then((res) => {
  //       setComedy(res.data)
  //       console.log(res.data)
  //     })
  //     .catch((error) => console.log(error));
  // }

  // const getNewsPodcasts = async () => {
  //   getPodcastByCategory("news")
  //     .then((res) => {
  //       setNews(res.data)
  //       console.log(res.data)
  //     })
  //     .catch((error) => console.log(error));
  // }

  // const getSportsPodcasts = async () => {
  //   getPodcastByCategory("sports")
  //     .then((res) => {
  //       setsports(res.data)
  //       console.log(res.data)
  //     })
  //     .catch((error) => console.log(error));
  // }

  // const getCrimePodcasts = async () => {
  //   getPodcastByCategory("crime")
  //     .then((res) => {
  //       setCrime(res.data)
  //       console.log(res.data)
  //     })
  //     .catch((error) => console.log(error));
  // }

  const getallData = async () => {
    setLoading(true);
    if (currentUser) {
      setLoading(true);
      await getUser();
    }
    await getAllPodcast();
    setLoading(false);
  }

  useEffect(() => {
    getallData();
  }, [currentUser])

  return (
    <DashboardMain>
      {loading ?
        <Loader>
          <CircularProgress />
        </Loader>
        :
        <>
          {currentUser && user && user.podcasts && user.podcasts.length > 0 &&
            <FilterContainer box={true}>
              <Topic>Your Uploads
                <Link to={`/profile`} style={{ textDecoration: "none" }}>
                  <Span>Show All</Span>
                </Link>
              </Topic>
              <Podcasts>
                {user.podcasts.slice(0, 10).map((podcast) => (
                  <PodcastCard podcast={podcast} user={user} setSignInOpen={setSignInOpen} />
                ))}
              </Podcasts>
            </FilterContainer>
          }
          <FilterContainer>
            <Topic>Podcasts
              {/* <Link to={`/showpodcasts/mostpopular`} style={{ textDecoration: "none" }}>
                <Span>Show All</Span>
              </Link> */}
            </Topic>
            <Podcasts>
              {allPodcasts.slice(0, 10).map((podcast) => (
                <PodcastCard podcast={podcast} user={user} setSignInOpen={setSignInOpen} />
              ))}
            </Podcasts>
          </FilterContainer>
        </>
      }
    </DashboardMain>
  )
}

export default Dashboard