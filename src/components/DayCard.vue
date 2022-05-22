<template>
  <div
    class="day"
    :class="{'day-lg': mdAndUp}"
    :style="{backgroundColor: day.color||'rgb(235, 237, 240)'}"
    @click="showComment"
  >
    <v-card
      v-if="commentShow"
      flat
      color="rgba(0, 0, 0, .87)"
      class="comment"
      :class="{'comment-lg': mdAndUp}"
      :style="{
        [tail]: '-3px',
      }"
      @click.stop
    >
      <div
        class="px-1 text-caption content"
      >
        <strong class="d-flex">
          {{ day.date+(day.value?`, ${day.value}`:'') }}
          <template v-if="!mdAndUp">
            <v-spacer />
            <v-btn
              size="sm"
              icon
              color="transparent"
              elevation="0"
              @click="emit('editDay')"
            >
              <v-icon
                size="10"
                class="ma-0"
              >mdi-circle-edit-outline</v-icon>
            </v-btn>
          </template>
        </strong>
        -
        <div>
          {{ day.comment||'不过是无聊的又一天罢了..' }}
        </div>
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
  commentShow: { type: Boolean, default: () => false },
  day: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['editDay']);

const { width: displayWidth, mdAndUp } = useDisplay();
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
