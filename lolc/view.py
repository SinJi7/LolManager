import pickle

class PikkleContainer:
    def __init__(self, object=None, filename="matches.pickle") -> None:
        self.object:Database = None
        if object == None:
            with open(filename, 'rb') as f:
                self.object:Database = pickle.load(f)
        else:
            self.object:Database = object
        
    def add(self, mid, data):
        self.object.add(mid=mid, data=data)

    def is_in(self, mid):
        return self.object.is_in(mid=mid)
    
    def getdata(self):
        return self.object.getdata()
    
    def getSize(self):
        return self.object.getSize()
    
    def save(self):
        with open("matches.pickle", 'wb') as f:
            pickle.dump(self.object, f)


class Database:
    def __init__(self):
        self.data = {}

    def add(self, mid, data):
        self.data[mid] = data

    def is_in(self, mid):
        return mid in self.data
    
    def getdata(self):
        return self.data
    
    def getSize(self):
        return len(self.data)
    
p = PikkleContainer()
data = p.getdata()

print([i for i in data])
print(len([i for i in data]))