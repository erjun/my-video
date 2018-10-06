<template>
  <div id="wrapper">
    <el-row>
      <span class="title">
        <el-button @click="openFile">Open</el-button>
        <el-button @click="scanDir">scanDir</el-button>
      </span>
    </el-row>
    <div>
      <div>
        <Tags/>
      </div>
      <div>
          <el-row>
            <el-col :span="4" v-for="(item, index) in videos" :key="index" style="padding:20px;">
              <el-card :body-style="{ padding: '0px' }">
                <div style="height:100px;position: relative;" :id="item._id + '_imgBox'">
                </div>
                <!--  -->
                <div style="padding: 14px;">
                  <div style="overflow: hidden;height: 18px;">{{ item.name }}</div>
                  <div class="bottom clearfix">
                    <time class="time">{{ formatTime(item.add_time) }}</time>
                    <el-button type="text" class="button" @click="dialogFormVisible = true;currentEditVideo = Object.assign({},item)">edit</el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
        </el-row>
         <div class="block">
            <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-sizes="[10,20,50,100]"
              :page-size="pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="count">
            </el-pagination>
          </div>
      </div>
    </div>
    <el-dialog title="edit" :visible.sync="dialogFormVisible">
      <el-form :model="currentEditVideo">
        <el-form-item :label="key" :label-width="formLabelWidth" v-for="(key, index) in currentVideoKeys" :key="index">
          <el-input v-model="currentEditVideo[key]" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="description" :label-width="formLabelWidth">
          <el-input v-model="currentEditVideo['description']" auto-complete="off" type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">cancel</el-button>
        <el-button type="primary" @click="updateVideo">enter</el-button>
        <el-button @click="deleteVideo">delete</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Tags from "./LandingPage/Tags";
import { debug } from "util";
import { defaultCoreCipherList, defaultCipherList } from "constants";
import { desktopCapturer } from "electron";
import path from "path";
import { setInterval, clearInterval } from "timers";
const fs = require("fs");

var videoPlayer = document.createElement("video");
videoPlayer.autoplay = true;
videoPlayer.className = "videoPreviewEl";
videoPlayer.loop = true;
var timer = null;

// 不允许创建,编辑的key
// _id 数据库自动创建的唯一id
// icon 保留的视频封面
// imgs 保留的视频截图
// description 描述
// add_time 视频加入时间
let disableKeys = ["_id", "icon", "imgs", "description", "add_time"];
export default {
  name: "landing-page",
  components: { Tags },
  data: function() {
    return {
      videos: [],
      dialogFormVisible: false,
      form: {},
      formLabelWidth: "120px",
      currentEditVideo: {},
      icons: {},
      currentPage: 1,
      pageSize: 10,
      count: 0
    };
  },
  computed: {
    currentVideoKeys() {
      return Object.keys(this.currentEditVideo).filter(key => {
        return disableKeys.indexOf(key) == -1;
      });
    }
  },
  methods: {
    openFile() {
      let that = this;
      this.$electron.remote.dialog.showOpenDialog(
        {
          properties: ["openFile", "multiSelections", ""]
        },
        function(res) {
          if (res) {
            that.addVideo(res);
          }
        }
      );
    },
    isVideo(ext) {
      let arr = [".mp4", ".avi", ".wmv"];
      if (arr.indexOf(ext) == -1) return false;
      return true;
    },
    addVideo(res) {
      let docArr = [];
      let that = this;
      res.forEach(fullPath => {
        let name = fullPath.replace(/^.*[\\\/]/, "");
        let ext = path.parse(name).ext;
        if (this.isVideo(ext) == false) return;
        let doc = {
          name: name,
          path: fullPath,
          add_time: new Date()
        };

        docArr.push(doc);
      });
      docArr.forEach(doc => {
        // 检查是否有重复
        let exist = this.$db.videos.count({ path: doc.path }, function(
          error,
          count
        ) {
          console.log("已经有了" + doc.path + " " + count);
          if (count == 0) {
            console.log("插入文件" + doc.path);
            that.$db.videos.insert(doc, that.updateVideos);
          }
        });
      });
    },
    updateVideos(err, docs) {
      if (err) {
        this.$message.error("error:" + err);
      } else {
        docs.forEach(item => {
          this.getImageAt(item);
        });
        this.videos = this.videos.concat(docs);
        this.getImageAt(this.videos[0]);

        // this.$message({
        //   message: "success",
        //   type: "success"
        // });
      }
    },
    updateCount() {
      let that = this;
      this.$db.videos.count({}, function(error, count) {
        console.log(count);
        that.count = count;
      });
    },
    openVideos() {
      this.updateCount();
      this.videos = [];
      this.$db.videos
        .find({})
        .skip((this.currentPage - 1) * this.pageSize)
        .limit(this.pageSize)
        .exec(this.updateVideos);
    },
    deleteVideoCallback(err, numRemoved) {
      if (err) {
        this.$message.error("error:" + err);
      } else {
        this.$message({
          message: "success",
          type: "success"
        });
      }
    },
    removeVideo(id) {
      let result = this.videos.find(item => {
        return item._id == id;
      });
      let index = this.videos.indexOf(result);
      this.videos.splice(index, 1);
    },
    deleteVideo() {
      let id = this.currentEditVideo._id;
      this.$db.videos.remove({ _id: id }, {}, this.deleteVideoCallback);
      this.removeVideo(id);
      this.dialogFormVisible = false;
    },
    updateVideoCallback(err, numReplaced) {
      if (err) {
        this.$message.error("error:" + err);
      } else {
        let id = this.currentEditVideo._id;
        let result = this.videos.find(item => {
          return item._id == id;
        });
        let index = this.videos.indexOf(result);
        this.videos.splice(index, 1, this.currentEditVideo);
        this.$message({
          message: "success",
          type: "success"
        });
      }
    },
    updateVideo() {
      this.$db.videos.update(
        this.currentEditVideo,
        {},
        this.updateVideoCallback
      );
    },
    getVideoImage(path, secs, callback) {
      var me = this,
        video = document.createElement("video");
      video.onloadedmetadata = function() {
        if ("function" === typeof secs) {
          secs = secs(this.duration);
        }
        this.currentTime = Math.min(
          Math.max(0, (secs < 0 ? this.duration : 0) + secs),
          this.duration
        );
      };
      video.onseeked = function(e) {
        var canvas = document.createElement("canvas");
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        var img = new Image();
        img.src = canvas.toDataURL();
        callback.call(me, img, this.currentTime, e);
      };
      video.onerror = function(e) {
        callback.call(me, undefined, undefined, e);
      };
      video.src = path;
    },
    getImageAt(item) {
      var secs = 0;
      var duration;
      var that = this;
      this.getVideoImage(
        item.path,
        function(totalTime) {
          duration = totalTime;
          return secs;
        },
        function(img, secs, event) {
          if (event.type == "seeked") {
            // console.log(duration)
            let box = document.getElementById(item._id + "_imgBox");
            img.addEventListener("mouseover", function() {
              let average = duration / 5;
              let currentPlay = 0;
              videoPlayer.poster = img.src;
              videoPlayer.src = item.path;
              videoPlayer.muted = true;
              videoPlayer.height = 100;
              box.appendChild(videoPlayer);
              timer = window.setInterval(function() {
                currentPlay += average;
                if (currentPlay >= duration) {
                  currentPlay = 0;
                }
                console.log(currentPlay, videoPlayer.currentTime);
                if (currentPlay > videoPlayer.currentTime) {
                  videoPlayer.currentTime = currentPlay;
                }
              }, 2000);
            });
            img.addEventListener("mouseleave", function() {
              console.log("mouseleave");
              window.clearInterval(timer);
              timer = null;
              box.removeChild(videoPlayer);
            });
            if (box.childNodes.length == 0) {
              box.appendChild(img);
            }

            // var li = document.createElement("li");
            // li.innerHTML += "<b>Frame at second " + secs + ":</b><br />";
            // li.appendChild(img);
            // document.getElementById("app").appendChild(li);
            // if (duration >= ++secs) {
            //   showImageAt(secs);
            // }
          } else if (event.type == "error") {
            console.log(event);
          }
        }
      );
    },
    showImageAt(secs) {
      var duration;
      this.getVideoImage(
        this.currentEditVideo.path,
        function(totalTime) {
          duration = totalTime;
          return secs;
        },
        function(img, secs, event) {
          if (event.type == "seeked") {
            var li = document.createElement("li");
            li.innerHTML += "<b>Frame at second " + secs + ":</b><br />";
            li.appendChild(img);
            document.getElementById("app").appendChild(li);
            if (duration >= ++secs) {
              showImageAt(secs);
            }
          }
        }
      );
    },
    formatTime(date) {
      if (typeof date == "string") return date;
      let sp = "/";
      let tsp = ":";
      let str =
        date.getFullYear() +
        sp +
        (date.getMonth() + 1) +
        sp +
        date.getDate() +
        " " +
        date.getHours() +
        tsp +
        date.getMinutes() +
        tsp +
        date.getSeconds();
      return str;
    },
    // 扫描指定目录下的所有文件，有新文件就添加，已path为排重
    scanDir() {
      let that = this;
      this.$electron.remote.dialog.showOpenDialog(
        {
          properties: ["openDirectory"]
        },
        function(res) {
          if (res) {
            that.scan(res[0]);
          }
        }
      );
    },
    getFiles(dir, files_) {
      files_ = files_ || [];
      var files = fs.readdirSync(dir);
      for (var i in files) {
        var name = dir + "/" + files[i];
        if (fs.statSync(name).isDirectory()) {
          this.getFiles(name, files_);
        } else {
          files_.push(name);
        }
      }
      return files_;
    },
    scan(myDir) {
      let list = this.getFiles(myDir);
      console.log("一共" + list.length + "个文件");
      this.addVideo(list);
    },
    handleSizeChange(val) {
      console.log(`每页 ${val} 条`);
      this.pageSize = val;
      this.openVideos();
    },
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`);
      this.currentPage = val;
      this.openVideos();
    }
  },
  created() {
    this.openVideos();
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
img {
  height: 100%;
}

body {
  font-family: "Source Sans Pro", sans-serif;
}

#wrapper {
  background: radial-gradient(
    ellipse at top left,
    rgba(255, 255, 255, 1) 40%,
    rgba(229, 229, 229, 0.9) 100%
  );
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

#logo {
  height: auto;
  margin-bottom: 20px;
  width: 420px;
}

main {
  display: flex;
  justify-content: space-between;
}

main > div {
  flex-basis: 50%;
}

.left-side {
  display: flex;
  flex-direction: column;
}
.videoPreviewEl {
  display: inline-block;
  position: absolute;
  left: 0;
  max-height: 100%;
  top: 0;
  width: 100%;
  z-index: 0;
  pointer-events: none;
}
.welcome {
  color: #555;
  font-size: 23px;
  margin-bottom: 10px;
}

.title {
  color: #2c3e50;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 6px;
}

.title.alt {
  font-size: 18px;
  margin-bottom: 10px;
}

.doc p {
  color: black;
  margin-bottom: 10px;
}

.doc button {
  font-size: 0.8em;
  cursor: pointer;
  outline: none;
  padding: 0.75em 2em;
  border-radius: 2em;
  display: inline-block;
  color: #fff;
  background-color: #4fc08d;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 1px solid #4fc08d;
}

.doc button.alt {
  color: #42b983;
  background-color: transparent;
}

.time {
  font-size: 13px;
  color: #999;
}

.bottom {
  margin-top: 13px;
  line-height: 12px;
}

.button {
  padding: 0;
  float: right;
}

.image {
  width: 100%;
  display: block;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both;
}
</style>
