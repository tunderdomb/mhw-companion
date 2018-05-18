console.log("hello")

const fs = require('fs-extra')
const path = require('path')
const cheerio = require('cheerio')

const dlRoot = path.join(process.cwd(), 'download')
const dataRoot = path.join(process.cwd(), 'data')

const weaponCategories = [
  'insect-glaive',
  'bow',
  'great-sword',
  'hunting-horn',
  'light-bowgun',
  'gunlance',
  'dual-blades',
  'long-sword',
  'hammer',
  'heavy-bowgun',
  'lance',
  'sword',
  'charge-axe',
  'switch-axe'
]

const weaponSharpness = [
  'red', 'orange', 'yellow', 'green', 'blue', 'white'
]

function parseItem (html) {
  let card = html('.card')[1]
  let name = html('h1', card).text().trim()
  let description = html('h1 + p + p', card).text() || ''
  let [
    buy,
    sell,
    carry,
    rarity
  ] = [].map.call(html('.card-footer .p-3 .lead'), (element) => {
    return parseInt(html(element).text(), 10)
  })

  if (!name) {
    throw new Error('No name found')
  }

  return {
    name,
    description,
    buy,
    sell,
    carry,
    rarity
  }
}

function parseSkill (html) {
  let mainCard = html('.card')[1]
  let table = html('.table tr', mainCard)

  let name = html('h1', mainCard).text().trim()
  let description = html('h1 + p + p', mainCard).text().trim() || ''
  let levels = [].map.call(html('.table tr > td + td', mainCard), (td) => {
    return html(td).text()
  })

  return {
    name,
    description,
    levels
  }
}

function parseSlots (element) {
  return [].map.call(cheerio('.zmdi', element), (element) => {
    let className = cheerio(element).attr('class')
    let match = className.match(/\d/)
    return match ? parseInt(match[0], 10) : 0
  })
}

function parseArmor (html) {
  let mainCard = html('.card')[1]
  let properties = html('.card-footer .p-3 .lead', mainCard)
  let vsCard = html('.card')[2]
  let skillCard = html('.card')[3]
  let craftingCard = html('.card')[4]

  let name = html('h1', mainCard).text().trim()
  let description = html('h1 + p + p', mainCard).text().trim() || ''
  let props = html('.card-footer .p-3 .lead', mainCard)
  let defense = html(props[0]).text().trim()
  let slots = parseSlots(props[1])
  let price = parseInt(html(props[2]).text().replace(/[,\s]/g, ''), 10)
  let male = !!html('.zmdi-male-alt', props[3]).length ? 'male' : ''
  let female = !!html('.zmdi-female', props[3]).length ? 'female' : ''
  let gender = female && male ? 'unisex' : female || male
  let rarity = parseInt(html(props[4]).text(), 10)

  let elements = [].map.call(html('.table tr', vsCard), (tr) => {
    let element = html(html('td', tr)[0]).text()
    let value = parseInt(html(html('td', tr)[1]).text(), 10)

    element = element.replace(/Vs\.\s+/, '').toLowerCase()

    return {
      element,
      value
    }
  })

  let skills = [].map.call(html('.table tr', skillCard), (tr) => {
    let [, skill, value] = html(tr).text().match(/\s*(.+)\s+(\+?\d)/)

    value = parseInt(value, 10)

    return {
      skill,
      value
    }
  })

  let crafting = [].map.call(html('.table tr', craftingCard), (tr) => {
    let [, item, count] = html(tr).text().match(/\s*(.+)\s+(x\d)/)

    count = parseInt(count, 10)

    return {
      item,
      count
    }
  })

  if (!name) {
    throw new Error('No title found')
  }

  return {
    name,
    description,
    defense,
    slots,
    price,
    gender,
    rarity,
    elements,
    skills,
    crafting
  }
}

function parseWeapon (html) {
  let mainCard = html('.card')[1]
  let properties = html('.card-footer .p-3', mainCard)

  let name = html('h1', mainCard).text().trim().trim()
  let category = html('h1 ~ p > a', mainCard).text().trim().toLowerCase().replace(/\s/, '-')

  if (!name) {
    throw new Error('Name not found')
  }

  if (!category) {
    throw new Error('Category not found')
  }

  let ret = {
    name,
    category
  }

  Array.prototype.forEach.call(properties, (prop) => {
    let name = html('> .text-muted', prop).text().trim()
    let value = html('.lead', prop).text().trim().toLowerCase()

    switch (true) {
      case /attack/i.test(name):
        ret.rawAttack = parseInt(value.match(/(\d+)\s*|\s*\d+/)[1], 10)
        break
      case /defense/i.test(name):
        ret.defense = parseInt(value, 10)
        break
      case /affinity/i.test(name):
        ret.affinity = parseInt(value, 10)
        break
      case /element/i.test(name):
        let hiddenElement = /[()]/.test(value)
        let [, dmg, element] = value.match(/(\d+)\s*(\w+)/)
        ret.element = element
        ret.hiddenElement = hiddenElement
        ret.elementAttack = parseInt(dmg, 10)
        break
      case /slots/i.test(name):
        ret.slots = parseSlots(prop)
        break
      case /sharpness/i.test(name):
        ret.sharpness = [].reduce.call(html('.d-flex:first-child div[class*="sharpness"][style*="width"]', prop), (sharpness, bar) => {
          bar = html(bar)
          let color = bar.attr('class').match(/sharpness-(\w+)/)[1]
          let level = parseInt(bar.attr('style').match(/width:\s*(\d+)/)[1], 10)

          if (weaponSharpness.includes(color)) {
            sharpness[color] = level
          }

          return sharpness
        }, {})
        break
      case /rare/i.test(name):
        ret.rarity = parseInt(value, 10)
        break
      default:
        // ret[name] = value
    }
  })

  return ret
}

function parseMonster (html) {
  let mainCard = html('.card')[1]
  let questsCard = html('.card')[2]
  let hitDataCard = html('.card')[3]
  let lootTableCard = html('.card')[4]
  let weaponsCard = html('.card')[5]

  let name = html('h1', mainCard).text().trim().trim()
  let weaknesses = [].map.call(html('tbody tr', html('table', hitDataCard)[0]), (tr) => {
    let tds = html('td', tr)
    let bodyPart = html(tds[0]).text()
    let sever = parseInt(html(tds[1]).text(), 10)
    let blunt = parseInt(html(tds[2]).text(), 10)
    let shot = parseInt(html(tds[3]).text(), 10)
    let fire = parseInt(html(tds[4]).text(), 10)
    let water = parseInt(html(tds[5]).text(), 10)
    let thunder = parseInt(html(tds[6]).text(), 10)
    let ice = parseInt(html(tds[7]).text(), 10)
    let dragon = parseInt(html(tds[8]).text(), 10)
    let stun = parseInt(html(tds[9]).text(), 10)

    return {
      bodyPart,
      sever,
      blunt,
      shot,
      fire,
      water,
      thunder,
      ice,
      dragon,
      stun
    }
  })
  let thresholds = [].map.call(html('tbody tr', html('table', hitDataCard)[1]), (tr) => {
    let tds = html('td', tr)
    let bodyPart = html(tds[0]).text().trim()
    let flinch = parseInt(html(tds[1]).text(), 10)
    let wound = parseInt(html(tds[2]).text(), 10)
    let sever = parseInt(html(tds[3]).text(), 10)

    return {
      bodyPart,
      flinch,
      wound,
      sever,
    }
  })

  let lrLootTable = html('table', lootTableCard)[0]
  let hrLootTable = html('table', lootTableCard)[1]
  let loots = []
  let currentList

  let parseLoot = (tr, rank) => {
    tr = html(tr)
    let td = html('td', tr)
    let rowspan = td.attr('rowspan')
    if (rowspan) {
      currentList = []
      loots.push({
        source: tr.text().trim(),
        loots: currentList,
        rank
      })
    } else {
      let [, item, count, chance] = tr.text().trim().match(/([\w\s]+?\b)\s*x(\d+)\s*(\d+)%/)
      currentList.push({
        item,
        count: parseInt(count),
        chance: parseInt(chance)
      })
    }
  }

  html('tr', lrLootTable).each((i, tr) => {
    return parseLoot(tr, 'hr')
  })
  html('tr', hrLootTable).each((i, tr) => {
    return parseLoot(tr, 'lr')
  })

  return {
    name,
    weaknesses,
    thresholds,
    loots
  }
}

function parseQuest () {
}

function parseDir (dir, dest, parser) {
  console.log("parsing dir", dir)
  return fs.readdir(dir).then((files) => {
    // console.log('files', files)
    return Promise.all(files.map((file) => {
      let filePath = path.join(dir, file)
      // console.log("filePath", filePath)
      return fs.readFile(filePath).then((content) => {
        let dom = cheerio.load(content.toString())
        return parser(dom)
      }).catch((err) => {
        console.error(`Failed to parse ${filePath}`, err)
        throw new Error(`Failed to parse ${filePath}`)
      })
    }))
  }).then((results) => {
    return fs.writeFile(dest, JSON.stringify(results, null, 2)).then(() => {
      return results
    })
  }).catch((err) => {
    console.error(`Failed to parse dir ${dir}`, err)
    throw new Error(`Failed to parse dir ${dir}`)
  })
}

Promise.resolve().then(() => {
  // return parseDir(path.join(dlRoot, 'item'), path.join(dataRoot, 'items.json'), parseItem)
}).then(() => {
  // return parseDir(path.join(dlRoot, 'skill'), path.join(dataRoot, 'skills.json'), parseSkill)
}).then(() => {
  // return parseDir(path.join(dlRoot, 'armor'), path.join(dataRoot, 'armors.json'), parseArmor)
}).then(() => {
  // return parseDir(path.join(dlRoot, 'weapon'), path.join(dataRoot, 'weapons.json'), parseWeapon)
}).then(() => {
  return parseDir(path.join(dlRoot, 'monster'), path.join(dataRoot, 'monsters.json'), parseMonster)
}).catch((err) => {
  console.error('Exec error', err)
})
