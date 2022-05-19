<template>
  <div
    class="day"
    :class="{'day-lg': lgAndUp}"
    :style="{backgroundColor: color}"
    @click="showComment"
  >
    <v-card
      v-if="commentShow"
      flat
      color="rgba(0, 0, 0, .87)"
      class="comment"
      :class="{'comment-lg': lgAndUp}"
      :style="{
        [tail]: '-3px',
      }"
      @click.stop
    >
      <div
        class="px-1 text-caption content"
      >
        <strong>
          <template v-if="value">
            {{ date }}, {{ value }}
          </template>
          <template v-else>
            {{ date }}
          </template>
        </strong>
        <br>
        -
        <br>
        <template v-if="comment">
          {{ comment }}
        </template>
        <template v-else>
          不过是无聊的又一天罢了..
        </template>
      </div>
      <div
        class="tail"
        :style="{
          [tail]: '5px',
        }"
      />
    </v-card>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useDisplay } from 'vuetify';

defineProps({
  value: { type: [String, Number], default: () => '' },
  comment: { type: String, default: () => '' },
  date: { type: String, default: () => '' },
  commentShow: { type: Boolean, default: () => false },
  color: { type: String, default: () => 'rgb(235, 237, 240)' },
});

const { width: displayWidth, lgAndUp } = useDisplay();
const tail = ref('left');

function showComment(ev) {
  tail.value = ev.x > displayWidth.value / 2 ? 'right' : 'left';
}
</script>
<style scoped>
.comment {
  position: absolute;
  color: white;
  z-index: 2;
  bottom: 14px;
  overflow: visible;
}

.comment-lg {
  bottom: 17px;
}

.content {
  max-width: 160px;
  max-height: 125px;
  width: max-content;
  word-wrap: break-word;
  word-break: break-all;
  user-select: none;
  line-height: 12px;
  padding: 4px 8px;
  overflow-y: auto;
}

.tail {
  width: 0;
  height: 0;
  border: 3px solid transparent;
  border-top-color: rgba(0, 0, 0, .87);
  border-bottom: 0;
  position: absolute;
  bottom: -3px;
}

.day {
  width: 10px;
  height: 10px;
  margin: 1.5px;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.day-lg {
  width: 13px;
  height: 13px;
}
</style>
