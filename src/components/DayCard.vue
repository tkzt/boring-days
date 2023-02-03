<template>
  <div
    class="day d-flex align-center justify-center"
    :class="{'day-lg': mdAndUp}"
    :style="{backgroundColor: day.color||'rgb(235, 237, 240)'}"
    @click="!mdAndUp&&showComment()"
    @mouseenter="mdAndUp&&showComment()"
    @mouseleave="mdAndUp&&(commentShow = false)"
  >
    <div
      v-click-outside="{
        handler: ()=>(commentShow = false),
        closeConditional: ()=>commentShow
      }"
      style="width: 100%; height: 100%; pointer-events: none;"
    >
      <v-tooltip
        v-model="commentShow"
        location="top"
        activator="parent"
      >
        <div
          class="text-caption"
        >
          <div class="d-flex align-center">
            <div style="height: 12px">
              {{ day.date }}
            </div>
            <div
              v-if="!mdAndUp"
              style="height: 13px"
            >
              <v-spacer />
              <v-btn
                size="12"
                icon
                color="transparent"
                style="pointer-events: initial"
                variant="flat"
                class="ml-2"
                @click.stop="emit('editDay')"
              >
                <v-icon size="12">
                  mdi-circle-edit-outline
                </v-icon>
              </v-btn>
            </div>
          </div>
          <v-divider class="mt-4 mb-1" />
          <div>
            <template v-if="day.value">
              <strong>{{ day.value }}</strong>,
            </template>
            {{ (day.comment||'不过是无聊的一天罢了 : )') }}
          </div>
        </div>
      </v-tooltip>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useDisplay } from 'vuetify';

defineProps({
  day: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['editDay']);

const { mdAndUp } = useDisplay();
const commentShow = ref(false);

function showComment() {
  commentShow.value = true;
}
</script>
<style scoped>
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
