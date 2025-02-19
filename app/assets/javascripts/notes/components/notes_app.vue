<script>
import { mapGetters, mapActions } from 'vuex';
import { getLocationHash } from '../../lib/utils/url_utility';
import Flash from '../../flash';
import * as constants from '../constants';
import eventHub from '../event_hub';
import noteableNote from './noteable_note.vue';
import noteableDiscussion from './noteable_discussion.vue';
import discussionFilterNote from './discussion_filter_note.vue';
import systemNote from '../../vue_shared/components/notes/system_note.vue';
import commentForm from './comment_form.vue';
import placeholderNote from '../../vue_shared/components/notes/placeholder_note.vue';
import placeholderSystemNote from '../../vue_shared/components/notes/placeholder_system_note.vue';
import skeletonLoadingContainer from '../../vue_shared/components/notes/skeleton_note.vue';
import highlightCurrentUser from '~/behaviors/markdown/highlight_current_user';
import initUserPopovers from '../../user_popovers';

export default {
  name: 'NotesApp',
  components: {
    noteableNote,
    noteableDiscussion,
    systemNote,
    commentForm,
    placeholderNote,
    placeholderSystemNote,
    skeletonLoadingContainer,
    discussionFilterNote,
  },
  props: {
    noteableData: {
      type: Object,
      required: true,
    },
    notesData: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    shouldShow: {
      type: Boolean,
      required: false,
      default: true,
    },
    helpPagePath: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      isFetching: false,
      currentFilter: null,
    };
  },
  computed: {
    ...mapGetters([
      'isNotesFetched',
      'discussions',
      'convertedDisscussionIds',
      'getNotesDataByProp',
      'isLoading',
      'commentsDisabled',
      'getNoteableData',
      'userCanReply',
    ]),
    noteableType() {
      return this.noteableData.noteableType;
    },
    allDiscussions() {
      if (this.isLoading) {
        const totalNotes = parseInt(this.notesData.totalNotes, 10) || 0;

        return new Array(totalNotes).fill({
          isSkeletonNote: true,
        });
      }

      return this.discussions;
    },
    canReply() {
      return this.userCanReply && !this.commentsDisabled;
    },
  },
  watch: {
    shouldShow() {
      if (!this.isNotesFetched) {
        this.fetchNotes();
      }
    },
    allDiscussions() {
      if (this.discussonsCount) {
        this.discussonsCount.textContent = this.allDiscussions.length;
      }
    },
  },
  created() {
    this.discussonsCount = document.querySelector('.js-discussions-count');

    this.setNotesData(this.notesData);
    this.setNoteableData(this.noteableData);
    this.setUserData(this.userData);
    this.setTargetNoteHash(getLocationHash());
    eventHub.$once('fetchNotesData', this.fetchNotes);
  },
  mounted() {
    if (this.shouldShow) {
      this.fetchNotes();
    }

    const { parentElement } = this.$el;
    if (parentElement && parentElement.classList.contains('js-vue-notes-event')) {
      parentElement.addEventListener('toggleAward', event => {
        const { awardName, noteId } = event.detail;
        this.toggleAward({ awardName, noteId });
      });
    }
  },
  updated() {
    this.$nextTick(() => {
      highlightCurrentUser(this.$el.querySelectorAll('.gfm-project_member'));
      initUserPopovers(this.$el.querySelectorAll('.js-user-link'));
    });
  },
  beforeDestroy() {
    this.stopPolling();
  },
  methods: {
    ...mapActions([
      'setLoadingState',
      'fetchDiscussions',
      'poll',
      'toggleAward',
      'scrollToNoteIfNeeded',
      'setNotesData',
      'setNoteableData',
      'setUserData',
      'setLastFetchedAt',
      'setTargetNoteHash',
      'toggleDiscussion',
      'setNotesFetchedState',
      'expandDiscussion',
      'startTaskList',
      'convertToDiscussion',
      'stopPolling',
    ]),
    fetchNotes() {
      if (this.isFetching) return null;

      this.isFetching = true;

      return this.fetchDiscussions({ path: this.getNotesDataByProp('discussionsPath') })
        .then(() => {
          this.initPolling();
        })
        .then(() => {
          this.setLoadingState(false);
          this.setNotesFetchedState(true);
          eventHub.$emit('fetchedNotesData');
          this.isFetching = false;
        })
        .then(() => this.$nextTick())
        .then(() => this.startTaskList())
        .then(() => this.checkLocationHash())
        .catch(() => {
          this.setLoadingState(false);
          this.setNotesFetchedState(true);
          Flash('Something went wrong while fetching comments. Please try again.');
        });
    },
    initPolling() {
      if (this.isPollingInitialized) {
        return;
      }

      this.setLastFetchedAt(this.getNotesDataByProp('lastFetchedAt'));

      this.poll();
      this.isPollingInitialized = true;
    },
    checkLocationHash() {
      const hash = getLocationHash();
      const noteId = hash && hash.replace(/^note_/, '');

      if (noteId) {
        const discussion = this.discussions.find(d => d.notes.some(({ id }) => id === noteId));

        if (discussion) {
          this.expandDiscussion({ discussionId: discussion.id });
        }
      }
    },
    startReplying(discussionId) {
      return this.convertToDiscussion(discussionId)
        .then(() => this.$nextTick())
        .then(() => eventHub.$emit('startReplying', discussionId));
    },
  },
  systemNote: constants.SYSTEM_NOTE,
};
</script>

<template>
  <div v-show="shouldShow" id="notes">
    <ul id="notes-list" class="notes main-notes-list timeline">
      <template v-for="discussion in allDiscussions">
        <skeleton-loading-container v-if="discussion.isSkeletonNote" :key="discussion.id" />
        <template v-else-if="discussion.isPlaceholderNote">
          <placeholder-system-note
            v-if="discussion.placeholderType === $options.systemNote"
            :key="discussion.id"
            :note="discussion.notes[0]"
          />
          <placeholder-note v-else :key="discussion.id" :note="discussion.notes[0]" />
        </template>
        <template
          v-else-if="discussion.individual_note && !convertedDisscussionIds.includes(discussion.id)"
        >
          <system-note
            v-if="discussion.notes[0].system"
            :key="discussion.id"
            :note="discussion.notes[0]"
          />
          <noteable-note
            v-else
            :key="discussion.id"
            :note="discussion.notes[0]"
            :show-reply-button="canReply"
            @startReplying="startReplying(discussion.id)"
          />
        </template>
        <noteable-discussion
          v-else
          :key="discussion.id"
          :discussion="discussion"
          :render-diff-file="true"
          :help-page-path="helpPagePath"
        />
      </template>
      <discussion-filter-note v-show="commentsDisabled" />
    </ul>

    <comment-form v-if="!commentsDisabled" :noteable-type="noteableType" />
  </div>
</template>
