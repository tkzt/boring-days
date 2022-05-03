<template>
  <v-container
    class="justify-center d-flex align-center flex-wrap align-content-center"
    style="height: 100vh"
    fluid
  >
    <v-col
      cols="12"
      md="6"
      lg="4"
      class="pt-0"
    >
      <v-card
        width="100%"
        flat
        color="transparent"
        class="d-flex flex-wrap"
      >
        <!-- logo -->
        <v-col
          cols="12"
          class="d-flex align-center text-h5 justify-center mb-6 pt-0"
        >
          <v-img
            src="/src/assets/logo.png"
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
            variant="contained-text"
          >
            {{ warning.indication }}
          </v-alert>
        </v-col>
        <v-col
          cols="12"
          class="py-0"
          :class="{'mt-4': error.model}"
        >
          <v-alert
            v-model="error.model"
            closable
            type="error"
            variant="contained-text"
          >
            {{ error.indication }}
          </v-alert>
        </v-col>

        <!-- textfield -->
        <v-col
          cols="12"
          class="py-0 mt-6"
        >
          <v-text-field
            v-model="form.appId"
            label="App Id*"
            variant="outlined"
            density="comfortable"
            :error-messages="errorMessages['appId']"
            @input="resetValidation('appId')"
            @blur="validate('appId')"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-0"
        >
          <v-text-field
            v-model="form.appKey"
            label="App Key*"
            variant="outlined"
            density="comfortable"
            :error-messages="errorMessages['appKey']"
            @input="resetValidation('appKey')"
            @blur="validate('appKey')"
            @keydown="keyDown"
          />
        </v-col>

        <!-- submit button -->
        <v-col
          cols="12"
          class="d-flex align-center justify-center"
        >
          <v-btn
            color="primary"
            :disabled="submitting"
            @click="submit"
          >
            <v-progress-circular
              v-if="submitting"
              indeterminate
              width="2"
              size="20"
            />
            <template v-else>
              Sign In
            </template>
          </v-btn>
          <v-spacer />
          <v-checkbox
            v-model="rememberMe"
            label="记住我的信息"
            hide-details
            color="primary"
            class="flex-grow-0"
          />
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
const signedInKey = 'bd-signed-in';

// data
const router = useRouter();
const store = useStore();
const rememberMe = ref(true);
const form = reactive({
  appId: '',
  appKey: '',
});
const warning = reactive({ model: false, indication: '' });
const error = reactive({ model: false, indication: '' });
const errorMessages = reactive({
  appId: '',
  appKey: '',
});
const submitting = ref(false);

// funcs
function resetValidation(field = 'all') {
  let fields;
  if (field === 'all') {
    fields = Object.keys(form);
  } else {
    fields = [field];
  }

  fields.forEach((f) => { errorMessages[f] = ''; });
}

const validate = (field = 'all') => {
  let fields;
  let valid = true;
  if (field === 'all') {
    fields = Object.keys(form);
  } else {
    fields = [field];
  }

  fields.forEach((f) => {
    if (!form[f]) {
      errorMessages[f] = `${f} 不可为空`;
      valid = false;
    }
  });

  return valid;
};

const submit = async () => {
  warning.model = false;
  error.model = false;
  const valid = validate();
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
      error.indication = initResult === false ? '登录失败，请检查输入是否正确' : initResult;
    }

    submitting.value = false;
  } else {
    warning.model = true;
    warning.indication = '请先确保输入有效';
  }
};

const keyDown = (ev) => {
  if (ev.key === 'Enter') {
    submit();
  }
};
</script>
