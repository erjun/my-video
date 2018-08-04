<template>
  <div id="wrapper">
    <el-row>
      <span class="title">
        <el-button @click="openFile">Open</el-button>
      </span>
    </el-row>
    <el-row>
      <el-col :span="8" v-for="(item, index) in videos" :key="index">
        <el-card :body-style="{ padding: '0px' }">
          <div style="height:80px;line-height:80px;width:45px;text-align:center;">
            <img v-if="item.icon" :src="item.icon" class="image">
            <template v-else>
              <!-- no icon -->
            </template>
          </div>
          <!--  -->
          <div style="padding: 14px;">
            <span>{{ item.name }}</span>
            <div class="bottom clearfix">
              <time class="time">{{ formatTime(item.add_time) }}</time>
              <el-button type="text" class="button" @click="dialogFormVisible = true;currentEditVideo = Object.assign({},item)">edit</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
        <!-- <system-information></system-information> -->
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
import SystemInformation from "./LandingPage/SystemInformation";
import { debug } from "util";
import { defaultCoreCipherList, defaultCipherList } from "constants";
// 不允许创建,编辑的key
// _id 数据库自动创建的唯一id
// icon 保留的视频封面
// imgs 保留的视频截图
// description 描述
// add_time 视频加入时间
let disableKeys = ["_id", "icon", "imgs", "description", "add_time"];
export default {
  name: "landing-page",
  components: { SystemInformation },
  data: function() {
    return {
      videos: [],
      dialogFormVisible: false,
      form: {},
      formLabelWidth: "120px",
      currentEditVideo: {}
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
    addVideo(res) {
      let docArr = [];
      res.forEach(fullPath => {
        let name = fullPath.replace(/^.*[\\\/]/, "");
        let doc = {
          name: name,
          add_time: new Date()
        };
        docArr.push(doc);
      });

      this.$db.videos.insert(docArr, this.updateVideos);
    },
    updateVideos(err, docs) {
      if (err) {
        this.$message.error("error:" + err);
      } else {
        this.videos = this.videos.concat(docs);
        console.log(this.videos);
        this.$message({
          message: "success",
          type: "success"
        });
      }
    },
    openVideos() {
      this.$db.videos
        .find({})
        .skip(0)
        .limit(10)
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
      console.log(str);
      return str;
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
