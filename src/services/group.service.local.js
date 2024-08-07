import { storageService } from './async-storage.service'
import { utilService } from './util.service'

const GROUPS_KEY = 'groupDB'
_createDemoGroups()

export const groupService = {
  query,
  getById,
  remove,
  save,
  getExpenseById,
  removeExpense,
  saveExpense,
  getAllExpensesFromGroups,
  getDefaultGroup,
  getDefaultExpense,
  getMembersFullDetails,
  getAllFriendsFromGroups,
  getFriendById,
  getFriendGroup,
  getExpenseDistribution,
}

async function query() {
  try {
    const groups = await storageService.query(GROUPS_KEY)
    return groups
  } catch (err) {
    console.log('Query -> Had issues querying groups', err)
    throw new Error(err)
  }
}

async function getById(groupId) {
  const group = await storageService.get(GROUPS_KEY, groupId)
  return group
}

function remove(groupId) {
  return storageService.remove(GROUPS_KEY, groupId)
}

function save(group) {
  if (group._id) {
    return storageService.put(GROUPS_KEY, group)
  } else {
    return storageService.post(GROUPS_KEY, group)
  }
}

////////////////////////////////////////////////////

function getExpenseById(group, expenseId) {
  const expense = group.expenses.find(e => e._id === expenseId)
  return expense
}

function removeExpense(group, expenseId) {
  const expenseIdx = group.expenses.findIndex(expense => expense._id === expenseId)
  if (expenseIdx < 0) {
    throw new Error(`Update failed, cannot find expense with id: ${expenseId}`)
  }
  group.expenses.splice(expenseIdx, 1)
  return save(group)
}

function saveExpense(group, expense) {
  if (expense._id) {
    return _updateExpense(group, expense)
  } else {
    return _addExpense(group, expense)
  }
}

function _addExpense(group, expense) {
  expense._id = utilService.makeId()
  expense.createdAt = Date.now()
  expense.lastUpdated = Date.now()

  group.expenses.push(expense)
  return save(group)
}

function _updateExpense(group, expense) {
  const expenseIdx = group.expenses.findIndex(e => e._id === expense._id)
  if (expenseIdx < 0) {
    throw new Error(`Update failed, cannot find expense with id: ${expense._id}`)
  }

  expense.lastUpdated = Date.now()
  group.expenses.splice(expenseIdx, 1, expense)
  return save(group)
}

function getAllExpensesFromGroups(groups) {
  return groups.reduce((expenses, group) => {
    const groupExpenses = [...group.expenses]

    // ! Creating expenses array with mini-version of it's group
    const expensesWithGroups = groupExpenses.map(expense => {
      const { _id, title } = group
      return { ...expense, group: { _id, title } }
    })

    expenses.push(...expensesWithGroups)
    return expenses
  }, [])
}

////////////////////////////////////////////////////

function getDefaultGroup() {
  return {
    title: '',
    imgUrl: '/assets/img/general/group-default.png', // todo cloudinary
    members: [],
    expenses: [],
    activities: [],
  }
}

// ! When on friend details and adding new expense, adding automatically to involvedMembers
function getDefaultExpense(friendId = null) {
  return {
    title: '',
    amount: 0,
    at: Date.now(),
    paidBy: null,
    involvedMembersIds: friendId ? [friendId] : [],
    notes: [],
  }
}

function getMembersFullDetails(group, memberIds) {
  return memberIds.map(memberId => {
    const fullMember = group.members.find(m => m._id === memberId)
    return fullMember
  })
}

function getAllFriendsFromGroups(groups) {
  const friends = groups.reduce((acc, group) => {
    acc = [...acc, ...group.members]
    return acc
  }, [])

  return friends.sort((f1, f2) => f1.fullName.localeCompare(f2.fullName))
}

async function getFriendById(friendId) {
  try {
    const groups = await query()
    const allFriends = getAllFriendsFromGroups(groups)
    const friend = allFriends.find(f => f._id === friendId)
    if (!friend) throw new Error(`Could not find friend with id:${friendId}`)
    return friend
  } catch (err) {
    console.log('Had issues with loading friend:', err)
    throw err
  }
}

async function getFriendGroup(friendId) {
  try {
    const groups = await query()
    const group = groups.find(g => g.members.some(m => m._id === friendId))
    if (!group) throw new Error(`Could not find group with member:${friendId}`)
    return group
  } catch (err) {
    console.log("Had issues with getting friend's group:", err)
    throw err
  }
}

function getExpenseDistribution({ amount, involvedMembersIds }) {
  const totalPerMember = (amount / (involvedMembersIds.length + 1)).toFixed(2)
  return utilService.getFormattedCurrency(totalPerMember)
}

////////////////////////////////////////////////////

// * -------------------- DEMO DATA --------------------

function _createDemoGroups() {
  let groups = utilService.loadFromStorage(GROUPS_KEY)

  if (!groups || !groups.length) {
    groups = []

    const group1 = _createDemoGroup('Familia')
    const group2 = _createDemoGroup('The Squad')
    const group3 = _createDemoGroup('Microsoft Fullstack Office')

    groups = [group1, group2, group3]
    utilService.saveToStorage(GROUPS_KEY, groups)
  }
}

function _createDemoGroup(title) {
  const group = getDefaultGroup()

  group._id = utilService.makeId()
  group.title = title
  group.members = _generateGroupMembers(title)
  group.expenses = _generateDemoExpenses(group)
  group.imgUrl = '/assets/img/general/group-default.png'

  return group
}

function _generateDemoExpenses({ title, members }) {
  const lowercasedGroupTitle = title.toLowerCase().replaceAll(' ', '')
  const expensesPerGroupMap = {
    familia: [
      'Grocery Shopping',
      'Family Dinner',
      'New Refrigerator',
      'Utility Bill',
      'Weekend Getaway',
      'School Supplies',
      'Home Repairs',
      'Internet Bill',
      'Gas Bill',
      'Movie Night',
    ],
    thesquad: [
      'Concert Tickets',
      'Beach Trip',
      'Birthday Party',
      'Road Trip',
      'Barbecue Party',
      'Group Dinner',
      'Escape Room',
      'Camping Trip',
      'Game Night',
      'Coffee Meetup',
    ],
    microsoftfullstackoffice: [
      'Team Lunch',
      'Office Supplies',
      'Software Licenses',
      'Conference Tickets',
      'Team Building Activity',
      'Client Meeting Lunch',
      'Office Party',
      'Remote Work Equipment',
      'Coffee for Office',
      'Business Travel Expenses',
    ],
  }
  const expenses = expensesPerGroupMap[lowercasedGroupTitle]

  const fullExpenses = expenses.map(expense => {
    const newExpense = _generateDemoExpense(expense, members)
    return newExpense
  })

  return fullExpenses
}

function _generateDemoExpense(title, members) {
  const newExpense = getDefaultExpense()

  newExpense._id = utilService.makeId()
  newExpense.title = title
  newExpense.amount = utilService.getRandomIntInclusive(10, 250)

  // ! Generating random paying member
  const rndMember = members[utilService.getRandomIntInclusive(0, members.length - 1)]
  newExpense.paidBy = rndMember

  // ! Generating random involved members ids
  const rndInvolvedMembers = members.filter(member => {
    if (member._id !== rndMember._id && Math.random() > 0.5) return member
  })

  // ! Insure that there is at least one involved member
  if (!rndInvolvedMembers.length) {
    const rndInvolvedMember = members.find(m => m._id !== rndMember._id)
    rndInvolvedMembers.push(rndInvolvedMember)
  }

  newExpense.involvedMembersIds = rndInvolvedMembers.map(m => m._id)

  // ! Generating random timestamp
  const rndTimestamp = utilService.getRandomTimestampLastMonth()
  newExpense.at = newExpense.createdAt = newExpense.lastUpdated = rndTimestamp

  return newExpense
}

function _generateGroupMembers(group) {
  switch (group) {
    case 'Familia':
      return [
        {
          _id: utilService.makeId(),
          fullName: 'Avi Cohen',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Mor Cohen',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Daniel Cohen',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Yotam Cohen',
          imgUrl: '/assets/img/general/user-default.png',
        },
      ]

    case 'The Squad':
      return [
        {
          _id: utilService.makeId(),
          fullName: 'Bar Levi',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Moshe Shaked',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Ori Lahav',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Ron Aran',
          imgUrl: '/assets/img/general/user-default.png',
        },
      ]

    case 'Microsoft Fullstack Office':
      return [
        {
          _id: utilService.makeId(),
          fullName: 'Limor Bar',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Assaf Hollander',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Michael Yerushalmi',
          imgUrl: '/assets/img/general/user-default.png',
        },
        {
          _id: utilService.makeId(),
          fullName: 'Shilat Brudo',
          imgUrl: '/assets/img/general/user-default.png',
        },
      ]

    default:
      return
  }
}
