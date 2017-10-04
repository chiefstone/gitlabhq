export function createImageBadge(noteId, { x, y }, classNames = []) {
  const buttonEl = document.createElement('button');
  const classList = classNames.concat(['btn-transparent', 'js-image-badge']);
  classList.forEach(className => buttonEl.classList.add(className));
  buttonEl.setAttribute('type', 'button');
  buttonEl.setAttribute('disabled', true);
  buttonEl.dataset.noteId = noteId;
  buttonEl.style.left = `${x}px`;
  buttonEl.style.top = `${y}px`;

  return buttonEl;
}

export function addImageBadge(containerEl, { coordinate, badgeText, noteId }) {
  const buttonEl = createImageBadge(noteId, coordinate, ['badge']);
  buttonEl.innerText = badgeText;

  containerEl.appendChild(buttonEl);
}

export function addImageCommentBadge(containerEl, { coordinate, noteId }) {
  const buttonEl = createImageBadge(noteId, coordinate, ['image-comment-badge', 'inverted']);
  const iconEl = document.createElement('i');
  iconEl.className = 'fa fa-comment-o';
  iconEl.setAttribute('aria-label', 'comment');

  buttonEl.appendChild(iconEl);
  containerEl.appendChild(buttonEl);
}

export function addAvatarBadge(el, event) {
  const { noteId, badgeNumber } = event.detail;

  // Add badge to new comment
  const avatarBadgeEl = el.querySelector(`#${noteId} .badge`);
  avatarBadgeEl.innerText = badgeNumber;
  avatarBadgeEl.classList.remove('hidden');
}
