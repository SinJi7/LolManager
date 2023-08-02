import './App.css';
import { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Link, Routes, useNavigate } from 'react-router-dom';
import {search_user, get_ParticipantDto_by_puuid, search_user_match_size} from './api';

import { Object_to_array, data_analyze, runModel } from './model';

//완성 후에 디자인 신경 쓰기
function App() {
  const [apiKey, setApiKey] = useState({})
  const [env, setEnv] = useState({
    api_key:"RGAPI-883a438a-684d-42a8-b4c8-b38a85c72b7c",
    search_history:{},
  })

  return (
    <Router>
      <nav className='navigate'>
        <div className='naviBox'>
          <Link to="/Simulation">Simulation</Link>
        </div>
        <div className='naviBox'>
          <Link to="/Setting">Setting</Link>
        </div>
        <div className='naviBox'>
          <Link to="/Search">Search</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Search" element={<Search env={env}/>} />
        <Route path="/Simulation" element={<Simulation env={env}/>} />
        <Route path="/Setting" element={<Setting env={env} setEnv={setEnv}/>} />
      </Routes>
    </Router>
  );
}

function Home(){
  return (<div className='containerS'>
    <h1>LOL Manager</h1>
  </div>)
}

function Setting({env, setEnv}){
  function onChange_apikey(e){
    setEnv({
      ...env,
      api_key:e.target.value
    })
  }
  return(
  <div class="container">
    <h2>Riot API Setting</h2>
    <p><a href="https://developer.riotgames.com/">apikey 발급</a></p>
    <input class="api-key-input" placeholder="input api key..." onChange={onChange_apikey} value={env.api_key}/>
  </div>)
}

function SearchBar({setUser, env, history}){
  const [showloading, setShowloaing] = useState(false)
  const [messagBox, setMessageBox] = useState("")

  //유저에 대한 정보를 검색해 setUser에 저장
  async function onSearch(e){
    e.preventDefault();
    setUser(null)
    const s_text = e.target[0].value
    setShowloaing(true)

    //전적검색 api
    //예외처리 추가
    //로딩구현
    await search_user(env.api_key, s_text)
      .then(res =>{
        setUser(res)//검색된 정보 저장
      })
      .catch(err => {
        setMessageBox("존재하지 않는 아이디, 혹은 너무 많은 요청")
        console.log(err)
      })

    setShowloaing(false)
  }

  //컴포넌트 반환
  return (<div className='search-container'>
    <form onSubmit={onSearch}>
      <input className='search-input' placeholder="검색"/>
      <input className='search-button' type="submit" value="&#128269;"/>
    </form>

    {showloading && <Loding />}
    {messagBox != "" && <Message text={messagBox} setMessageBox={setMessageBox}/>}
  </div>) 
}

function Search({env}){
  const [user, setUser] = useState(null)

  return(
  <div>
    <SearchBar setUser={setUser} env={env}/>
    {user != null && <User user={user} />}
    {user != null && <Matches user={user} />}
  </div>)
}

function User({user}){
  const [userRank, setRank] = useState({
    solo: "Unranked",
    free: "Unranked",
    arena: "Unranked"
  })
  useEffect(() => {

    //자유랭크, 일반랭크, 아레나를 가져와서 전환
    user.PlayerInfoDto.forEach(LeagueEntryDTO =>{
      if(LeagueEntryDTO.queueType == "RANKED_FLEX_SR"){
        //자유랭크"
        setRank((prevRank) => ({
          ...prevRank,
          free: {
            tier: LeagueEntryDTO.tier,
            rank: LeagueEntryDTO.rank,
            win: LeagueEntryDTO.wins,
            lose: LeagueEntryDTO.losses,
            winrate:  LeagueEntryDTO.wins / (LeagueEntryDTO.wins + LeagueEntryDTO.losses)
          }
        }))
      } 
      //솔로랭크
      else if(LeagueEntryDTO.queueType == "RANKED_SOLO_5x5"){
        setRank((prevRank) => ({
          ...prevRank,
          solo: {
            tier: LeagueEntryDTO.tier,
            rank: LeagueEntryDTO.rank,
            win: LeagueEntryDTO.wins,
            lose: LeagueEntryDTO.losses,
            winrate:  LeagueEntryDTO.wins / (LeagueEntryDTO.wins + LeagueEntryDTO.losses)
          }
        }))
      }
      //아래나
      else if(LeagueEntryDTO.queueType =="CHERRY"){
        setRank((prevRank) => ({
          ...prevRank,
          arena: {
            tier: "Unranked",
            win: LeagueEntryDTO.wins,
            lose: LeagueEntryDTO.losses,
            winrate:  LeagueEntryDTO.wins / (LeagueEntryDTO.wins + LeagueEntryDTO.losses)
          }
        }))
      }
    })
  }, [user])

  function rankdList(){
    const enumRank = {
      arena:"아레나",
      solo:"솔로랭크",
      free:"자유랭크"
    }

    //html로 변환
    return Object.keys(userRank).map((key) => {
      if(userRank[key] == "Unranked"){
        return <div className='rankdbord'>
          <p>{enumRank[key]}</p>
          Unranked
        </div>
      }
      else{
        return <div className='rankdbord'>
          <p>{enumRank[key]}</p>
          {userRank[key].tier} {userRank[key].rank}
          <div>
            Win: {userRank[key].win} <br/>
            Lose: {userRank[key].lose} <br/>
            WinRate : {(userRank[key].winrate*100).toFixed(2)}%
          </div>
        </div>
      }
    })
  }

  return(<div>
    <div>
      {rankdList()}
    </div>
  </div>)
}

function Matches({user}){
  const m_list = user.matchInfoList.map(m =>
    <Match uid={user.puuid} info={m.info} key={user.puuid}/>
  )
  return (<div>
    {m_list}
  </div>)
}

function Match({uid, info}){

  const [showHistory, setShowHistory] = useState(false);

  const onClick = () => {
    setShowHistory(!showHistory);
  };

  function p(ParticipantDto){
    const win = ParticipantDto.win

    const name = ParticipantDto.summonerName
    const cName = ParticipantDto.championName
    const clv = ParticipantDto.champLevel

    const cs = ParticipantDto.totalMinionsKilled

    const k = ParticipantDto.kills
    const d = ParticipantDto.deaths
    const a = ParticipantDto.assists
    const deal = ParticipantDto.totalDamageDealtToChampions
    const take = ParticipantDto.totalDamageTaken

    const visionScore = ParticipantDto.visionScore
    const wardk = ParticipantDto.wardsKilled
    const wardp = ParticipantDto.wardsPlaced

    const itemIdLs = [ParticipantDto.item0, ParticipantDto.item1, ParticipantDto.item2, ParticipantDto.item3, ParticipantDto.item4, ParticipantDto.item5, ParticipantDto.item6]
    const itemImg = itemIdLs.map(iId => <img src={`http://ddragon.leagueoflegends.com/cdn/13.14.1/img/item/${iId}.png`}/>)

    const champImg = <img src={`http://ddragon.leagueoflegends.com/cdn/13.14.1/img/champion/${cName}.png`}/>


    return {win, name, clv, cs, k, d, a, deal, take, visionScore, wardk, wardp, itemImg, champImg}
  }

  const target_user = p(get_ParticipantDto_by_puuid(uid, info.participants))

  return(
  <div>
    <div 
      className={target_user.win? 'historyBoxB': 'historyBoxR'}
    >
      {target_user.champImg} {target_user.k} /{target_user.d}/ {target_user.a} {target_user.win ? "승리" : "패배"}

      <button className='gray-button' onClick={onClick}>
        <span class="arrow">&#9660;</span>
      </button>
    </div> 
    <MatchDetail participants={info.participants} showHistory={showHistory}/>
    
  </div>)
}

function MatchDetail({participants, showHistory}){

  const [css, setCss] = useState(
    {
      overflow: 'auto',
      width: "100%",
      height: "0px",
      transition: 'width 0.5s ease-out, height 0.5s ease-out'
    }
  )

  useEffect(()=>{
    if(showHistory){
      setCss({
        ...css,
        width: "100%",
        height: "50%",
      })
    }else{
      setCss({
        ...css,
        width: "100%",
        height: "0px",
      })
    }
  },[showHistory])

  //승리 패배 분류
  const winners = participants.filter(ParticipantDto => ParticipantDto.win);
  const losers = participants.filter(ParticipantDto => !ParticipantDto.win);

  function dataParse(ParticipantDto){
    const name = ParticipantDto.summonerName
    const cName = ParticipantDto.championName
    const clv = ParticipantDto.champLevel

    const cs = ParticipantDto.totalMinionsKilled

    const k = ParticipantDto.kills
    const d = ParticipantDto.deaths
    const a = ParticipantDto.assists
    const deal = ParticipantDto.totalDamageDealtToChampions
    const take = ParticipantDto.totalDamageTaken

    const visionScore = ParticipantDto.visionScore
    const wardk = ParticipantDto.wardsKilled
    const wardp = ParticipantDto.wardsPlaced

    const itemIdLs = [ParticipantDto.item0, ParticipantDto.item1, ParticipantDto.item2, ParticipantDto.item3, ParticipantDto.item4, ParticipantDto.item5, ParticipantDto.item6]
    const itemImg = itemIdLs.map(iId => <img src={`http://ddragon.leagueoflegends.com/cdn/13.14.1/img/item/${iId}.png`}/>)

    const champImg = <img src={`http://ddragon.leagueoflegends.com/cdn/13.14.1/img/champion/${cName}.png`}/>

    return (
    <tr key={name}>
      <td>{champImg} {clv} {name} </td>
      <td>{k} : {d} : {a}</td>
      <td>{deal} {take}</td>
      <td>{visionScore} ({wardk} : {wardp}) </td>
      <td> {cs} </td>
      <td>{itemImg}</td>
    </tr>)
  }
  const winnerUserObjects = winners.map(ParticipantDto => dataParse(ParticipantDto));
  const loserUserObjects = losers.map(ParticipantDto => dataParse(ParticipantDto));

  return(<div className='historyTb' style={css}>
     <table className='bluetb' >
      <th>승리</th>
      <th>KDA</th>
      <th>피해량</th>
      <th>와드</th>
      <th>CS</th>
      <th>아이템</th>
      { winnerUserObjects }
     </table>
     <table className='redtb'>
      <th>패배</th>
      <th>KDA</th>
      <th>피해량</th>
      <th>와드</th>
      <th>CS</th>
      <th>아이템</th>
      { loserUserObjects }
     </table>
  </div>)
}

function Simulation({env}){
  const [blue, setBlue] = useState({})
  const [red, setRed] = useState({})
  const [showloading, setShowloaing] = useState(false)
  
  const [messagBox, setMessageBox] = useState("")

  function addBlue(num, name){
    setBlue({
      ...blue,
      [num]:{
        name
      }
    })
  }

  function addRed(num, name){
    setRed({
      ...red,
      [num]:{
        name
      }
    })
  }

  async function onStart(){
    //유저가 전부 입력되지 않음
    if(!(Object.keys(blue).length == 5 && Object.keys(red).length == 5)){
      setMessageBox("유저가 입력되지 않음")
      return
    }

    //Object.keys(blue)
    setShowloaing(true)

    const blue_position_samples = [];
    for (const position of Object.keys(blue)) {
      const position_sample = await search_user_match_size(env.api_key, blue[position].name, 3)
        .then(participants => data_analyze(position, participants, 100));
      blue_position_samples.push(position_sample);
    }

    const red_position_samples = [];
    for (const position of Object.keys(red)) {
      const position_sample = await search_user_match_size(env.api_key, red[position].name, 3)
        .then(participants => data_analyze(position, participants, 200));
      red_position_samples.push(position_sample);
    }

    const all_position_samples = [...blue_position_samples, ...red_position_samples]
    let mergedObject = Object.assign({}, ...all_position_samples);

    const sample = Object_to_array(mergedObject)
    const res = await runModel(sample)

    if(res == 0){
      setMessageBox("블루팀 승리")
    }
    else{
      setMessageBox("레드팀 승리")
    }

    setShowloaing(false)
  }

  //useEffect(()=>{}, [messagBox])
   return(<div className='containerS'>
    <div className='blueTeam'>
      {["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"].map((e) => <Input num={e} setter={addBlue} key={e}/>)}
    </div>
    <div className='redTeam'>
      {["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"].map((e) => <Input num={e} setter={addRed} key={e}/>)}
    </div>
    <button className='sbtn' onClick={onStart}>시작</button>
    {showloading && <Loding />}
    {messagBox != "" && <Message text={messagBox} setMessageBox={setMessageBox}/>}
  </div>)
}

function Message({text, setMessageBox}){
  function onClick(){
    setMessageBox("")
  }
  return (
    <div className="notification">
        <p>{text}</p>
        <button className='closebtn' onClick={onClick}>확인</button>
    </div>
    );
}

function Loding(){
  return(<div className='loading-spinner'>
  </div>)
}

function Input({setter, classname, num}){
  function onChange(e) {
    setter(num, e.target.value)
  }
  return(<input placeholder={num} onChange={onChange}/>)
}



export default App;
