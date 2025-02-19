<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import { GlLoadingIcon } from '@gitlab/ui';
import FunctionRow from './function_row.vue';
import EnvironmentRow from './environment_row.vue';
import EmptyState from './empty_state.vue';
import { CHECKING_INSTALLED } from '../constants';

export default {
  components: {
    EnvironmentRow,
    FunctionRow,
    EmptyState,
    GlLoadingIcon,
  },
  props: {
    clustersPath: {
      type: String,
      required: true,
    },
    helpPath: {
      type: String,
      required: true,
    },
    statusPath: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState(['installed', 'isLoading', 'hasFunctionData']),
    ...mapGetters(['getFunctions']),

    checkingInstalled() {
      return this.installed === CHECKING_INSTALLED;
    },
    isInstalled() {
      return this.installed === true;
    },
  },
  created() {
    this.fetchFunctions({
      functionsPath: this.statusPath,
    });
  },
  methods: {
    ...mapActions(['fetchFunctions']),
  },
};
</script>

<template>
  <section id="serverless-functions">
    <gl-loading-icon
      v-if="checkingInstalled"
      :size="2"
      class="prepend-top-default append-bottom-default"
    />

    <div v-else-if="isInstalled">
      <div v-if="hasFunctionData">
        <template>
          <div class="groups-list-tree-container js-functions-wrapper">
            <ul class="content-list group-list-tree">
              <environment-row
                v-for="(env, index) in getFunctions"
                :key="index"
                :env="env"
                :env-name="index"
              />
            </ul>
          </div>
        </template>
        <gl-loading-icon
          v-if="isLoading"
          :size="2"
          class="prepend-top-default append-bottom-default js-functions-loader"
        />
      </div>
      <div v-else class="empty-state js-empty-state">
        <div class="text-content">
          <h4 class="state-title text-center">{{ s__('Serverless|No functions available') }}</h4>
          <p class="state-description">
            {{
              s__(`Serverless|There is currently no function data available from Knative.
                   This could be for a variety of reasons including:`)
            }}
          </p>
          <ul>
            <li>Your repository does not have a corresponding <code>serverless.yml</code> file.</li>
            <li>Your <code>.gitlab-ci.yml</code> file is not properly configured.</li>
            <li>
              The functions listed in the <code>serverless.yml</code> file don't match the namespace
              of your cluster.
            </li>
            <li>The deploy job has not finished.</li>
          </ul>

          <p>
            {{
              s__(`Serverless|If you believe none of these apply, please check
                   back later as the function data may be in the process of becoming
                   available.`)
            }}
          </p>
          <div class="text-center">
            <a :href="helpPath" class="btn btn-success">
              {{ s__('Serverless|Learn more about Serverless') }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <empty-state v-else :clusters-path="clustersPath" :help-path="helpPath" />
  </section>
</template>
