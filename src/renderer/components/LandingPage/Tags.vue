<template>
  <div>
    <div class="title">Tags</div>
    <el-button @click="openAdd">add</el-button>
    <div class="items">
      <div class="item" v-for="(item, index) in tags" :key="index">
        <i class="el-icon-edit" @click="openEdit(item)"></i>
        <div class="name">{{ item.title }}</div>
        <el-tag v-for="(tag,index2) in item.tags" :key="index2">{{ tag }}</el-tag>
      </div>
    </div>
    <el-dialog title="add" :visible.sync="dialogFormVisible">
      <el-form :model="currentEditTags">
        <el-form-item label="title" :label-width="formLabelWidth">
          <el-input v-model="currentEditTags['title']" auto-complete="off"></el-input>
        </el-form-item>
        <span v-for="(key, index) in currentEditTags.tags" :key="index" style="width:100px;display: flex;">
             <el-input v-model="currentEditTags.tags[index]" auto-complete="off"></el-input><i class="el-icon-delete" @click="currentEditTags.tags.splice(index, 1)" size="small"
></i>
        </span>
     
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="currentEditTags.tags.push('')">add tag</el-button>
        <el-button @click="dialogFormVisible = false">cancel</el-button>
        <el-button type="primary" @click="addTags">enter</el-button>
        <el-button @click="deleteTags" v-if="isEdit">delete</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
function catchError(error) {
  console.log(error);
}
export default {
  data() {
    return {
      electron: process.versions["atom-shell"],
      name: this.$route.name,
      node: process.versions.node,
      path: this.$route.path,
      platform: require("os").platform(),
      vue: require("vue/package.json").version,
      dialogFormVisible: false,
      formLabelWidth: "120px",
      currentEditTags: {},
      isEdit: false,
      tags: []
    };
  },
  methods: {
    getTags() {
      this.tags = [];
      this.$db.tags
        .find({})
        .skip(0)
        .limit(10)
        .exec(this.updateTags);
    },
    updateTags(err, docs) {
      if (err) {
        this.$message.error("error:" + err);
      } else {
        this.tags = this.tags.concat(docs);
      }
    },
    openAdd() {
      this.isEdit = false;
      this.currentEditTags = {
        tags: []
      };
      this.dialogFormVisible = true;
    },
    openEdit(item) {
      this.isEdit = true;
      this.currentEditTags = item;
      this.dialogFormVisible = true;
    },
    addTags() {
      // update
      if (this.currentEditTags._id) {
        this.$db.videos.update(this.currentEditTags, {}, this.updateTags);
      } else {
        // add
        this.$db.tags.insert(this.currentEditTags, this.updateTags);
      }
    },
    deleteTags() {}
  },
  created() {
    this.getTags();
  }
};
</script>

<style scoped>
.title {
  color: #888;
  font-size: 18px;
  font-weight: initial;
  letter-spacing: 0.25px;
  margin-top: 10px;
}

.items {
  margin-top: 8px;
}

.item {
  display: flex;
  margin-bottom: 6px;
}

.item .name {
  color: #6a6a6a;
  margin-right: 6px;
}

.item .value {
  color: #35495e;
  font-weight: bold;
}
</style>
