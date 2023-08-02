import requests
import json
import pickle
from os.path import isfile
from time import sleep

class API_QUERY:
    API_KEY = "RGAPI-5ae48a22-5179-42d5-bdcf-faa33812da32"

    def get_summoner_by_name(self, name):
        res = requests.get(f"https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/{name}?api_key={API_QUERY.API_KEY}")
        if res.status_code == 200:
            return json.loads(res.text)
        elif res.status_code == 429:
            print("speedlimit")
            sleep(20)
        elif res.status_code == 403:
            print("api key 만료")
        else:
            return False

    #유저의 매칭 정보 반환
    def get_matches_by_puuid(self, puuid):
        res = requests.get(f"https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=20&api_key={API_QUERY.API_KEY}")
        if res.status_code == 200:
            return json.loads(res.text)
        elif res.status_code == 429:
            print("speedlimit")
            sleep(20)
        elif res.status_code == 403:
            print("api key 만료")
        else:
            return False

    #매치에 대한 상세 정보 반환
    def get_match_info(self, matchId):
        res = requests.get(f"https://asia.api.riotgames.com/lol/match/v5/matches/{matchId}?api_key={API_QUERY.API_KEY}")
        if res.status_code == 200:
            return json.loads(res.text)
        elif res.status_code == 429:
            print("speedlimit")
            sleep(20)
        elif res.status_code == 403:
            print("api key 만료")
        else:
            return False

    #유저에 대한 티어 반환
    def get_user_info(self, encryptedSummonerId):
        res = requests.get(f"https://asia.api.riotgames.com/lol/league/v4/entries/by-summoner/{encryptedSummonerId}")
        if res.status_code == 200:
            return json.loads(res.text)
        elif res.status_code == 429:
            print("speedlimit")
            sleep(20)
        elif res.status_code == 403:
            print("api key 만료")
        else:
            return False

#Database class 만 적재가능
# class PikkleContainer:
#     def __init__(self, object=None, filename="matches.pickle") -> None:
#         self.object:Database = None
#         if isfile("./matches.pickle"):
#             with open(filename, 'rb') as f:
#                 self.object:Database = pickle.load(f)
#         else:
#             if isfile("./matches.pickle"):
#                 raise Exception('피클 파일이 존재합니다, 코드 수정 바람')
#             self.object:Database = object
        
#     def add(self, mid, data):
#         self.object.add(mid=mid, data=data)

#     def is_in(self, mid):
#         return self.object.is_in(mid=mid)
    
#     def getdata(self):
#         return self.object.getdata()
    
#     def getSize(self):
#         return self.object.getSize()
    
#     def save(self):
#         with open("matches.pickle", 'wb') as f:
#             pickle.dump(self.object, f)
    

#has a 관계인 객체
class Progess():
    def __init__(self, ids):
        self.match_ids:list = ids
        self.size = len(self.match_ids)
        self.cursor = 0

    def next(self) -> str:
        if self.size <= self.cursor:
            return False
        else:
            now_cur = self.cursor
            self.cursor += 1
            return self.match_ids[now_cur]

class Database:
    def __init__(self):
        if isfile("./matches.json"):
            with open("matches.json", 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {}

    def add(self, mid, data):
        self.data[mid] = data

    def is_in(self, mid):
        return mid in self.data
    
    def getdata(self):
        return self.data
    
    def getSize(self):
        return len(self.data)
    
    def save(self):
        with open("matches.json", 'w') as f:
            json.dump(self.data, f)
    

class Collector(API_QUERY):
    def __init__(self) -> None:

        #두번째 돌릴때는 아래 코드 사용
        #self.match_data = PikkleContainer()
        self.match_data = Database()

        self.__progress_info:Progess = None
        #다음 수집 진행 후보군 puuid집합
        self.__next_progress = []
        self.__now_user = "" #현재 수집중인 유저 puuid

    #새로운 유저를 통해 새로운 리스트 반환
    def __deep(self):
        if self.__next_progress == [] :
            print("수집 불가")
            return False
        else:
            uuid = self.__next_progress.pop(0)
            matches = self.get_matches_by_puuid(uuid)
            self.__progress_info = Progess(matches)
            self.__now_user = uuid
            self.__user_save()
            return True

    def __user_save(self):
        with open("user.txt", "w") as f:
            f.write(self.__now_user)

    def run(self, start_point=None, start_uuid=None):
        #첫 시작
        if start_uuid != None:
            matches = self.get_matches_by_puuid(start_uuid)
            self.__now_user = start_uuid
            self.__progress_info = Progess(matches)
            print(len(matches))
        else:
            info = self.get_summoner_by_name(start_point)
            matches = self.get_matches_by_puuid(info["puuid"])
            self.__now_user = info["puuid"]
            self.__progress_info = Progess(matches)


        while True:
            while True:
                mid = self.__progress_info.next()    

                #매치 값이 올바르고 중복이 아닌 경우                
                if mid and not self.match_data.is_in(mid):
                    #매치 정보를 수집해서 저장한다
                    match_info:dict = self.get_match_info(mid)

                    if match_info["info"]["queueId"] == 420: #랭크게임일 경우
                        #다음에 수집할 유저 추가하기
                        users:list = match_info["metadata"]["participants"][:]
                        if self.__now_user in users:
                            users.remove(self.__now_user)
                        self.__next_progress += users

                        #매치 정보 저장
                        self.match_data.add(mid, match_info)
                        self.match_data.save()
                        
                        print(f"\rMatch count: {self.match_data.getSize()}", end="")
                    sleep(1.5)
                    
                    #슬립 필요
                elif mid and self.match_data.is_in(mid): #math값이 올바르고 중복인 경우
                    sleep(1.5)

                    print("중복")

                    #다음 유저가 아예 없을 경우수집
                    if self.__next_progress == []:
                        match_info:dict = self.get_match_info(mid)
                        if match_info["info"]["queueId"] == 420:
                            #다음에 수집할 유저 추가하기
                            users:list = match_info["metadata"]["participants"][:]
                            if self.__now_user in users:
                                users.remove(self.__now_user)
                            self.__next_progress += users
                else:
                    
                    break
            if not self.__deep():
                break
            sleep(3)


        #매칭 정보를 순회하며 매칭을 가져온다 ->

c = Collector()
c.run(start_point="롤로노아 중독자", start_uuid="L2VBxAHi5t8S3BQP1DuGmHXhWpJkG8M_o8vo8UjQzftx7NGg3FiVcfA6cKYfs83_FRhhKFdyZoS52Q")