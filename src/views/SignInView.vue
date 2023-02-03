<template>
  <v-container
    class="justify-center d-flex align-center"
    style="height: 100%"
    fluid
  >
    <v-col
      cols="12"
      md="6"
      lg="4"
      xl="3"
      class="pa-0"
    >
      <v-card
        width="100%"
        flat
        class="d-flex flex-wrap pa-4"
        rounded="lg"
      >
        <!-- logo -->
        <v-col
          cols="12"
          class="d-flex align-center text-h5 justify-center mb-3"
        >
          <v-img
            src="logo.svg"
            width="28"
            class="flex-grow-0 mr-4"
          />
          <span>
            Boring Days
          </span>
        </v-col>

        <!-- alert -->
        <v-col
          cols="12"
          class="py-0"
        >
          <v-alert
            v-model="warning.model"
            closable
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            {{ warning.indication }}
          </v-alert>
          <v-alert
            v-model="error.model"
            closable
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ error.indication }}
          </v-alert>
        </v-col>

        <v-form
          ref="formRef"
          style="width: 100%"
        >
          <!-- app id & app key -->
          <v-col
            cols="12"
            class="pb-1"
          >
            <v-text-field
              v-model="form.appId"
              label="App Id*"
              variant="outlined"
              density="compact"
              :rules="[
                val=>!!val || 'App Id can\'t be empty!'
              ]"
              @blur="form.appId = form.appId.trim()"
            />
          </v-col>
          <v-col
            cols="12"
            class="pb-1"
          >
            <v-text-field
              v-model="form.appKey"
              label="App Key*"
              variant="outlined"
              density="compact"
              :rules="[
                val=>!!val || 'App Key can\'t be empty!'
              ]"
              @keydown.enter="submit"
              @blur="form.appKey = form.appKey.trim()"
            />
          </v-col>
        </v-form>

        <!-- remember me -->
        <v-col
          cols="12"
          class="px-2 py-0"
        >
          <v-checkbox
            v-model="rememberMe"
            label="Remember Me"
            hide-details
            density="compact"
            color="primary"
          />
        </v-col>

        <!-- submit button -->
        <v-col
          cols="12"
          class="d-flex align-center justify-center mt-3"
        >
          <v-btn
            color="primary"
            block
            :loading="submitting"
            @click="submit"
          >
            Sign In
          </v-btn>
        </v-col>
      </v-card>
    </v-col>
  </v-container>
</template>
<script setup>
import {
  ref, reactive,
} from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { initAV } from '../utils/leancloud';

// normal
const signedInKey = 'signed-in';

// data
const router = useRouter();
const store = useStore();
const rememberMe = ref(true);
const formRef = ref(null);
const form = reactive({
  appId: '',
  appKey: '',
});
const warning = reactive({ model: false, indication: '' });
const error = reactive({ model: false, indication: '' });
const submitting = ref(false);

const submit = async () => {
  warning.model = false;
  error.model = false;
  const { valid } = await formRef.value.validate();
  if (valid) {
    submitting.value = true;
    const initResult = await initAV(form.appId, form.appKey);
    if (initResult === true) {
      store.commit('SET_SIGNED_IN', form);
      if (rememberMe.value) {
        localStorage.setItem(signedInKey, JSON.stringify(form));
      } else {
        sessionStorage.setItem(signedInKey, JSON.stringify(form));
      }
      router.push('/');
    } else {
      error.model = true;
      error.indication = initResult === false ? '登录失败，请检查输入是否正确！' : initResult;
    }

    submitting.value = false;
  } else {
    warning.model = true;
    warning.indication = '请先确保输入有效！';
  }
};
</script>
