import * as tf from '@tensorflow/tfjs';

const ch_order = ['100_TOP_kills', '100_TOP_deaths', '100_TOP_assists', '100_TOP_totalDamageDealtToChampions', '100_TOP_totalDamageTaken', '100_TOP_totalMinionsKilled', '100_TOP_wardsKilled', '100_TOP_wardsPlaced', '100_TOP_visionScore', '100_JUNGLE_kills', '100_JUNGLE_deaths', '100_JUNGLE_assists', '100_JUNGLE_totalDamageDealtToChampions', '100_JUNGLE_totalDamageTaken', '100_JUNGLE_totalMinionsKilled', '100_JUNGLE_wardsKilled', '100_JUNGLE_wardsPlaced', '100_JUNGLE_visionScore', '100_MIDDLE_kills', '100_MIDDLE_deaths', '100_MIDDLE_assists', '100_MIDDLE_totalDamageDealtToChampions', '100_MIDDLE_totalDamageTaken', '100_MIDDLE_totalMinionsKilled', '100_MIDDLE_wardsKilled', '100_MIDDLE_wardsPlaced', '100_MIDDLE_visionScore', '100_BOTTOM_kills', '100_BOTTOM_deaths', '100_BOTTOM_assists', '100_BOTTOM_totalDamageDealtToChampions', '100_BOTTOM_totalDamageTaken', '100_BOTTOM_totalMinionsKilled', '100_BOTTOM_wardsKilled', '100_BOTTOM_wardsPlaced', '100_BOTTOM_visionScore', '100_UTILITY_kills', '100_UTILITY_deaths', '100_UTILITY_assists', '100_UTILITY_totalDamageDealtToChampions', '100_UTILITY_totalDamageTaken', '100_UTILITY_totalMinionsKilled', '100_UTILITY_wardsKilled', '100_UTILITY_wardsPlaced', '100_UTILITY_visionScore', '200_TOP_kills', '200_TOP_deaths', '200_TOP_assists', '200_TOP_totalDamageDealtToChampions', '200_TOP_totalDamageTaken', '200_TOP_totalMinionsKilled', '200_TOP_wardsKilled', '200_TOP_wardsPlaced', '200_TOP_visionScore', '200_JUNGLE_kills', '200_JUNGLE_deaths', '200_JUNGLE_assists', '200_JUNGLE_totalDamageDealtToChampions', '200_JUNGLE_totalDamageTaken', '200_JUNGLE_totalMinionsKilled', '200_JUNGLE_wardsKilled', '200_JUNGLE_wardsPlaced', '200_JUNGLE_visionScore', '200_MIDDLE_kills', '200_MIDDLE_deaths', '200_MIDDLE_assists', '200_MIDDLE_totalDamageDealtToChampions', '200_MIDDLE_totalDamageTaken', '200_MIDDLE_totalMinionsKilled', '200_MIDDLE_wardsKilled', '200_MIDDLE_wardsPlaced', '200_MIDDLE_visionScore', '200_BOTTOM_kills', '200_BOTTOM_deaths', '200_BOTTOM_assists', '200_BOTTOM_totalDamageDealtToChampions', '200_BOTTOM_totalDamageTaken', '200_BOTTOM_totalMinionsKilled', '200_BOTTOM_wardsKilled', '200_BOTTOM_wardsPlaced', '200_BOTTOM_visionScore', '200_UTILITY_kills', '200_UTILITY_deaths', '200_UTILITY_assists', '200_UTILITY_totalDamageDealtToChampions', '200_UTILITY_totalDamageTaken', '200_UTILITY_totalMinionsKilled', '200_UTILITY_wardsKilled', '200_UTILITY_wardsPlaced', '200_UTILITY_visionScore']


async function runModel(sample) {

    const model = await tf.loadLayersModel('win_model/model.json');

    //console.log(1)
    const inputData = tf.tensor2d(sample, [1, 90]);;

    console.log(inputData)
    const result = model.predict(inputData);
    const resData = await result.data()

    return Math.floor(resData[0])
  }


function Object_to_array(obj){
  const res = []
  for(const e of ch_order){
    res.push(obj[e])
  }

  return res
}

function data_analyze(position, participants, team){
  const characteristic = [
    "kills", "deaths", "assists", "totalDamageDealtToChampions", "totalDamageTaken", "totalMinionsKilled", "wardsKilled", "wardsPlaced", "visionScore"
  ]

  const statsObject = {
    kills: 0,
    deaths: 0,
    assists: 0,
    totalDamageDealtToChampions: 0,
    totalDamageTaken: 0,
    totalMinionsKilled: 0,
    wardsKilled: 0,
    wardsPlaced: 0,
    visionScore: 0,
  };
  

  const result = participants.reduce((acc, curr) => {
    // 각 키를 순회하며, 존재하는 경우 값을 더함
    for (const key of characteristic) {
        acc[key] = acc[key] + curr[key];
    }
    return acc;
  }, statsObject);

  const model = {}

  //평균
  for (const key in result) {
    if (Object.hasOwnProperty.call(result, key)) {
      model[`${team}_${position}_${key}`] = parseInt(result[key] / participants.length);
    }
  }

  return model
}

export {runModel, data_analyze, Object_to_array};