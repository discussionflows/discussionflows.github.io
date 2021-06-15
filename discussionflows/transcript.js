class Transcript {

    constructor(meetingObj){
        this.tran = meetingObj.transcript;
        this.speakers = meetingObj.speakers;
        this.utterancelist = this.tran;
        this.turnlist = [];

        this.starttime = this.utterancelist[0].starttime;
        this.endtime = this.utterancelist[this.utterancelist.length -1 ].endtime;

        for(var u of this.utterancelist){
            this.starttime = Math.min(this.starttime, u.starttime);
            this.endtime = Math.max(this.endtime, u.endtime);
        }

        let last = null;
        let current = null;

        // organize topics in hierarchy
        this.topicList = {};
        for(var t of meetingObj.topics){

            t.child = [];

            if(!this.topicList[t.id]){
                this.topicList[t.id] = t;
            }
        }

        for(var t of meetingObj.topics){
            
            if(t.parent != null){
                this.topicList[t.parent].child.push(t);
            }
        }

        for(var t of meetingObj.topics){
            
            if(t.parent == null){
                this.assignTopicLevel(t, 0);
            }
        }

        // console.log(this.topicList);

        for(var u of this.utterancelist){
            u.adjustedTopic = u.topic;
        }

        // create turn list, i.e., multiple utterances with different topics but the same speaker are combined.
        for (let i = 0; i < this.tran.length; i++) {

            current = this.tran[i];
            current.type = "turn";

            if (i == 0) {
                last = current;

            } else {

                if (last.speakerID == current.speakerID) {
                    last.endtime = current.endtime;
                    last.fullText = last.fullText + " " + current.fullText;

                    if (i == this.length - 1) {
                        this.turnlist.push(last);
                    }

                } else {
                    this.turnlist.push(last);
                    last = current;

                    if (i == this.length - 1) {
                        this.turnlist.push(current);
                    }
                }
            }

        }


        this.speakingPace = {};

        for(var t of this.turnlist){
            t.duration = t.endtime-t.starttime;
            t.charCount = t.fullText.length;

            if(t.duration > 10){
                if(this.speakingPace[t.speakerID]){
                    this.speakingPace[t.speakerID].length += t.fullText.length;
                    this.speakingPace[t.speakerID].duration += t.duration;
                }else{
                    this.speakingPace[t.speakerID] = {"length":t.fullText.length, "duration":t.duration};
                }

                t.speakpace = t.fullText.length/t.duration;

            }else{
                t.speakpace = 0;
            }
        }
        

        this.meetingStats = new Map();

        this.totalTime = 0;
        this.totalChars = 0;
        this.totalTurns = 0;

        for(let i=0; i<this.turnlist.length; i++){
            var t = this.turnlist[i];

            if(this.meetingStats.has(t.speakerID)){
                var stats = this.meetingStats.get(t.speakerID);
                stats.time = stats.time + t.duration;
                stats.charCount = stats.charCount + t.charCount;
                stats.turn = stats.turn +1;
                this.meetingStats.set(t.speakerID, stats);
            }else{
                this.meetingStats.set(t.speakerID, {time:t.duration, charCount:t.charCount, turn:1});
            }

            this.totalTime += t.duration;
            this.totalChars += t.charCount;
            this.totalTurns += 1;

        }

    }

    assignTopicLevel(currentTopic, currentLevel){
        currentTopic.level = currentLevel;

        for(var t of currentTopic.child){
            this.assignTopicLevel(t, currentLevel+1);
        }

    }

    adjustUtteranceTopic(targetLevel){

        for(var u of this.utterancelist){

            if(u.topic){
                var currentTopic = this.topicList[u.topic];
                

                while(currentTopic.level > targetLevel && currentTopic.level > 0){
                    currentTopic = this.topicList[currentTopic.parent];

                }
                u.adjustedTopic = currentTopic.id;
            }

        }

        // console.log(this.utterancelist);
    }

    getTopicList(level){

        var topicforlevel = [];

        for(var t of Object.entries(this.topicList)){

            if(t[1].level < level || t[1].level == level){
                topicforlevel.push(t[1]);
            }

        }

        return topicforlevel;

    }

    getTopicStats(){

        var topicMap = {};
        var index = 0;

        for(var u of this.utterancelist){

            //sometimes an utterlance has no topic associated with it, it would end up entering "undefined" as id here
            
            if(topicMap[u.adjustedTopic]){

                if(topicMap[u.adjustedTopic]["stats"][u.speakerID]){
                    topicMap[u.adjustedTopic]["stats"][u.speakerID]["duration"]+=(u.endtime-u.starttime);
                    topicMap[u.adjustedTopic]["stats"][u.speakerID]["length"]+=1;
                }else{
                    topicMap[u.adjustedTopic]["stats"][u.speakerID] = {"speaker":u.speakerID, "length":1, "duration":u.endtime-u.starttime};
                }

                topicMap[u.adjustedTopic]["durationTotal"]+=(u.endtime-u.starttime);
                topicMap[u.adjustedTopic]["length"]+=1;

            }else{

                topicMap[u.adjustedTopic] = {"index":index++, "length":1, "durationTotal":(u.endtime-u.starttime), "stats":{}};
                topicMap[u.adjustedTopic]["stats"][u.speakerID] = {"speaker":u.speakerID, "length":1, "duration":u.endtime-u.starttime};
            }
        }

        // console.log(topicMap);

        return topicMap;
    }

    getTopicTimeline(){
        var timeline = [];
        var currentID, currentStart, currentEnd;

        for(var i=0; i<this.utterancelist.length; i++){

            var u = this.utterancelist[i];
            
            if(i==0){
                currentID = u.topic;
                currentStart = u.starttime;
                currentEnd = u.endtime;

            }else{

                if(u.topic == currentID){
                    currentEnd = u.endtime;
                }else{
                    timeline.push({"id":currentID, "start":currentStart, "end":currentEnd});
                    currentID = u.topic;
                    currentStart = u.starttime;
                    currentEnd = u.endtime;
                }

                if(i==this.utterancelist.length-1){
                    timeline.push({"id":currentID, "start":currentStart, "end":currentEnd});
                }

            }   
        }

        return timeline;
    }

    getAllwords(){
        
        var allWords = [];

        

        var segduration = 0;
        var wordDuration = 0;

        for(var u of this.utterancelist){

            for(var w of u.words){

                if(w.starttime && w.endtime){
                    w.duration = w.endtime - w.starttime;
                    w.speaker = u.speakerID;
                    w.topic = u.adjustedTopic;
                    allWords.push(w);
                    wordDuration += (w.duration);
                }else{
                    console.log(w);
                }
                
            }

            segduration+= (u.endtime-u.starttime);
        }

        // console.log("meeting duration: "+ (this.utterancelist[this.utterancelist.length-1].endtime - this.utterancelist[0].starttime));
        // console.log("total seg duration: "+segduration);
        // console.log("total word duration: "+wordDuration);

        allWords.sort(function(a,b){
            return a.starttime - b.starttime;
        });

        return allWords;
    }
    
    getWordsByTime(allWords, start, end){
        
        var words = [];

        for(var w of allWords){
            if(w.starttime >= start && w.starttime < end){
                words.push(w);
            }
        }

        // console.log(words);

        return words;
    }

    getinterval(){

        var allWords = this.getAllwords();

        var totalDuration = 0;
        var intervalEnd = 300;
        var intervalSet = [];

        var intervalStats = {};
        for(var w of allWords){
            if(w.starttime > intervalEnd){

                intervalEnd+=300;
                var intervalSummary = {};
                Object.assign(intervalSummary, intervalStats);
                intervalSet.push(intervalSummary);

            }

            if(intervalStats[w.speaker]){
                intervalStats[w.speaker] += w.duration;
            }else{
                intervalStats[w.speaker] = w.duration;
            }

            totalDuration+=w.duration;
        }

        intervalSet.push(intervalStats);

        // console.log(intervalSet);
        // console.log(totalDuration);

    }

}