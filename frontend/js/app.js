import { initBackgroundParticles } from './animations.js';
import { renderSidebar } from './ui.js';
import { loadHome, loadMatches, loadLearning, loadQuiz, loadPremium } from './dashboard.js';
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

const globals = {
  goToLogin,
  logout,
  loadHome,
  loadMatches,
  loadLearning,
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

if (!checkUrlParams()) {
  loadHome();
}
