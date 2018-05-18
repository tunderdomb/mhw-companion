class Stat {
  constructor () {
    this.name = ''
  }
}
const stats = {
  health: new Stat('health'),
  stamina: new Stat('stamina'),
  defense: new Stat('defense'),
  rawDmg: new Stat('rawDmg'),
  affinity: new Stat('affinity'),
  critical: new Stat('critical'),
  sharpness: new Stat('sharpness'),
}

class StatusEffect {}

class SkillEffect {
  constructor (description, condition, stat, boostType, boostValue) {
    this.description = description
    this.condition = condition
    this.stat = stat
    this.boostType = boostType // + % to increase decrease
    this.boostValue = boostValue
  }
}
class SkillLevel {
  constructor (lvl, effects = []) {
    this.lvl = lvl
    this.effects = []
  }
}
class Skill {
  constructor (name, levels) {
    this.name = ''
    this.levels = new Map()
  }
}
const skills = {
  agitator: new Skill('Agitator', [
    new SkillLevel(1, [
      new SkillEffect('', '', stats.rawDmg, '+', 4),
      new SkillEffect('', '', stats.affinity, '%', 3)]
    )
  ])
}

class Armor {
  constructor () {
    this.name = ''
    this.skills = []
  }
}
