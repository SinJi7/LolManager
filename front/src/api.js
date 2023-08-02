const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

async function search_user(api_key, name){
    //유저에 대한 정보 반환
    const SummonerDTO = await get_summoner_by_name(api_key, name)
    const PlayerInfoDto = await get_challenges_by_encryptedSummonerId(api_key, SummonerDTO.id)

    const matches = await get_matchIdes_by_puuid(api_key, SummonerDTO.puuid, 0, 20)

    //1초당 최대 20번 호출
    await sleep(2000)

    const matchInfoList = await Promise.all(
        matches.map(async e => 
        await get_matchInfo_by_matchId(api_key, e)
        )
    )

    const UserDto = {
        puuid:SummonerDTO.id,
        PlayerInfoDto,
        matchInfoList
    }

    return UserDto
}

//시뮬레이션에서 사용
async function search_user_match_size(api_key, name, size){
    const SummonerDTO = await get_summoner_by_name(api_key, name)
    const PlayerInfoDto = await get_challenges_by_encryptedSummonerId(api_key, SummonerDTO.id)

    //최근 전적 2판만 가져온다
    const matches = await get_matchIdes_by_puuid(api_key, SummonerDTO.puuid, 0, size)

    await sleep(1000) // 제대로 적용도지 않음

    const matchInfoList = await Promise.all(
        matches.map(async e => 
        await get_matchInfo_by_matchId(api_key, e)
        )
    )

    const target_Participants = matchInfoList.map(
        MatchDto => {
            const target_ParticipantDto = MatchDto.info.participants.filter(
                ParticipantDto => ParticipantDto.summonerId == SummonerDTO.id
            );

            return target_ParticipantDto[0]
        }
    )

    return target_Participants
}

function get_ParticipantDto_by_puuid(puuid, participants){
    const user = participants.filter(ParticipantDto => ParticipantDto.summonerId == puuid);
    return user[0]
}

async function get_summoner_by_name(api_key, name){
    const url = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${api_key}`
    const res = await fetch(url)
    const data = await res.json()

    return data
}

async function get_challenges_by_encryptedSummonerId(api_key, encryptedSummonerId){
    const url = `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}?api_key=${api_key}`
    const res = await fetch(url)
    const data = await res.json()
    return data
}

async function get_matchIdes_by_puuid(api_key, puuid, start, size){
    const url = `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${size}&api_key=${api_key}&queue=420`
    const res = await fetch(url)    
    const data = await res.json()
    return data 
}

async function get_matchInfo_by_matchId(api_key, matchId){
    const url = `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${api_key}`
    const res = await fetch(url)    
    const data = await res.json()
    return data
}

export {search_user, get_ParticipantDto_by_puuid, search_user_match_size};