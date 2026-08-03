import { initBackgroundParticles } from './animations.js';
import { renderSidebar } from './ui.js';
import { loadHome, loadMatches, loadQuiz, loadPremium } from './dashboard.js';
import { loadPersonalDashboard } from './personalDashboard.js';
import { loadLearningPortal } from './learningPortal.js';
import { loadProfile, updateDisplayName, updateUsername, updatePreferredSide, changePassword, updateProfilePic } from './profile.js';
import { logout } from './auth.js';
import { analyzeGame, checkUrlParams } from './analysis.js';
import {
  goToLogin,
  setColor,
  setRandomColor,
  startGame,
  toggleHints,
  toggleInGameHints,
  undoMove,
  getHint,
  resignGame,
  loadPlay,
  viewGameAnalysis,
  playAgain
} from './game.js';
import { renderAICoachWidget, initAICoachWidget } from './aiCoachWidget.js';

const globals = {
  goToLogin,
  logout,
  loadHome: loadPersonalDashboard,
  loadMatches,
  loadLearning: loadLearningPortal,
  loadQuiz,
  loadPremium,
  loadProfile,
  updateDisplayName,
  updateUsername,
  updatePreferredSide,
  changePassword,
  updateProfilePic,
  analyzeGame,
  checkUrlParams,
  setColor,
  setRandomColor,
  startGame,
  toggleHints,
  toggleInGameHints,
  undoMove,
  getHint,
  resignGame,
  loadPlay,
  viewGameAnalysis,
  playAgain
};

Object.assign(window, globals);

initBackgroundParticles();
renderSidebar();

// Inject AI Coach floating widget into the DOM
const widgetContainer = document.createElement('div');
widgetContainer.innerHTML = renderAICoachWidget();
document.body.appendChild(widgetContainer.firstElementChild || widgetContainer);
initAICoachWidget();

if (!checkUrlParams()) {
  // Use personalized dashboard
  loadPersonalDashboard();
}
