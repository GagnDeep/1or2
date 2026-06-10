// Simple Event Emitter
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(data));
  }
}

// Global Application Store
class Store extends EventEmitter {
  constructor() {
    super();
    this.state = {
      user: this.loadUserStats(),
      createdPolls: this.loadCreatedPolls(),
      votedPolls: this.loadVotedPolls() // format: { pollId: { choiceIndex, timestamp } }
    };
  }

  loadUserStats() {
    const defaultStats = {
      totalVotes: 0,
      majorityMatches: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    try {
      const stored = localStorage.getItem('1or2_user');
      return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
    } catch (e) {
      console.error('Failed to load user stats', e);
      return defaultStats;
    }
  }

  saveUserStats() {
    try {
      localStorage.setItem('1or2_user', JSON.stringify(this.state.user));
    } catch (e) {
      console.error('Failed to save user stats', e);
    }
    this.emit('stats_changed', this.state.user);
  }

  loadCreatedPolls() {
    try {
      const stored = localStorage.getItem('1or2_created_polls');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveCreatedPolls() {
    try {
      localStorage.setItem('1or2_created_polls', JSON.stringify(this.state.createdPolls));
    } catch (e) {
      console.error('Failed to save created polls', e);
    }
    this.emit('created_polls_changed', this.state.createdPolls);
  }

  loadVotedPolls() {
    try {
      const stored = localStorage.getItem('1or2_voted_polls');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  saveVotedPolls() {
    try {
      localStorage.setItem('1or2_voted_polls', JSON.stringify(this.state.votedPolls));
    } catch (e) {
      console.error('Failed to save voted polls', e);
    }
    this.emit('voted_polls_changed', this.state.votedPolls);
  }

  // Actions
  recordVote(pollId, choiceIndex, isMajorityMatch = null) {
    // Record specific poll vote
    this.state.votedPolls[pollId] = {
      choiceIndex,
      timestamp: Date.now()
    };
    this.saveVotedPolls();

    // Update global stats
    this.state.user.totalVotes++;
    if (isMajorityMatch !== null) {
      if (isMajorityMatch) {
        this.state.user.majorityMatches++;
        this.state.user.currentStreak++;
        if (this.state.user.currentStreak > this.state.user.bestStreak) {
          this.state.user.bestStreak = this.state.user.currentStreak;
        }
      } else {
        this.state.user.currentStreak = 0;
      }
    }
    this.saveUserStats();
  }

  hasVoted(pollId) {
    return this.state.votedPolls.hasOwnProperty(pollId);
  }

  getVote(pollId) {
    return this.state.votedPolls[pollId]?.choiceIndex;
  }

  addCreatedPoll(pollData, payloadStr) {
    const poll = {
      id: Date.now().toString(),
      title: pollData.title || 'Untitled Poll',
      type: pollData.type,
      payload: payloadStr,
      createdAt: Date.now()
    };
    this.state.createdPolls.unshift(poll);
    this.saveCreatedPolls();
    return poll;
  }

  deleteCreatedPoll(id) {
    this.state.createdPolls = this.state.createdPolls.filter(p => p.id !== id);
    this.saveCreatedPolls();
  }

  // Data Portability
  exportData() {
    const data = {
      user: this.state.user,
      createdPolls: this.state.createdPolls,
      votedPolls: this.state.votedPolls,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1or2-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (data.user) {
        this.state.user = { ...this.state.user, ...data.user };
        this.saveUserStats();
      }
      if (data.createdPolls) {
        this.state.createdPolls = data.createdPolls;
        this.saveCreatedPolls();
      }
      if (data.votedPolls) {
        this.state.votedPolls = { ...this.state.votedPolls, ...data.votedPolls };
        this.saveVotedPolls();
      }
      return true;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  }
}

export const store = new Store();
