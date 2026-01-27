class CardGallery {
    constructor() {
        this.cards = [];
        this.filteredCards = [];
        this.currentView = 'grid';
        this.filters = {
            type: 'all',
            deck: 'all',
            category: 'all',
            search: '',
            players: 'all'
        };
        this.translationMap = {};
        this.initialized = false; // 新增：初始化状态标志
    }

    async init() {
        // 加载卡牌数据
        await this.loadCards();

        // 初始化UI
        this.initUI();

        // 应用默认筛选（新增这行）
        this.applyFilters();

        // 渲染卡牌
        this.renderCards();

        // 更新统计数据
        this.updateStats();

        this.initialized = true; // 标记为已初始化
    }

    async loadCards() {
        try {
            // 从本地JSON文件加载卡牌数据
            const response = await fetch('cards.json');
            if (!response.ok) {
                throw new Error('无法加载卡牌数据');
            }

            const cardsData = await response.json();

            // 从本地加载中文翻译文件
            const translationResponse = await fetch('agricola-zh.json');
            if (!translationResponse.ok) {
                console.warn('无法加载中文翻译文件，将显示英文名称');
            }

            this.translationMap = translationResponse.ok ?
                await translationResponse.json() : {};

            // 转换为数组并格式化数据，应用中文翻译
            this.cards = Object.values(cardsData).map(card => ({
                ...card,
                originalName: card.name,  // 保留英文原名
                name: this.getChinese(card.name),  // 应用中文翻译
                prerequisite: this.getChinese(card.prerequisite),  // 应用中文翻译
                costText: this.getChinese(card.costText)  // 应用中文翻译
            }));

            console.log(`成功加载 ${this.cards.length} 张卡牌`);

        } catch (error) {
            console.error('加载卡牌数据失败:', error);
            this.showErrorMessage('加载卡牌数据失败，请刷新页面重试。');
        }
    }

    getChinese(englishName) {
        // 如果有中文翻译，使用中文，否则使用英文
        return this.translationMap[englishName] || englishName;
    }

    formatCategory(category) {
        if (!category) return '其他';

        // 简化分类显示
        const categoryMap = {
            'FarmCategory': '农场规划',
            'BoosterCategory': '行动增强',
            'PointsCategory': '分数奖励',
            'GoodsCategory': '货物奖励',
            'FoodCategory': '食物奖励',
            'CropCategory': '作物奖励',
            'ResourceCategory': '建造资源奖励',
            'LivestockCategory': '动物奖励',
            // 扩展类别
            'ACTION_-_BAKE': '行动增强-烤面包',
            'ACTION_-_FAMILY_GROWTH': '行动增强-家庭成长',
            'ACTION_-_FENCE': '行动增强-栅栏',
            'ACTION_-_GUEST': '行动增强-访客',
            'ACTION_-_IMPROVEMENT': '行动增强-发展',
            'ACTION_-_MAJOR_IMPROVEMENT': '行动增强-主要发展',
            'ACTION_-_MINOR_IMPROVEMENT': '行动增强-次要发展',
            'ACTION_-_OCCUPATION': '行动增强-职业卡牌',
            'ACTION_-_PLOW': '行动增强-耕种',
            'ACTION_-_RENOVATION': '行动增强-翻新',
            'ACTION_-_ROOM': '行动增强-房间',
            'ACTION_-_SOW': '行动增强-播种',
            'ACTION_-_STABLE': '行动-畜棚',
            'ACTION': '行动增强',
            'ANIMAL_-_CATTLE': '动物奖励-牛',
            'ANIMAL_-_PIG': '动物奖励-野猪',
            'ANIMAL_-_SHEEP': '动物奖励-羊',
            'ANIMAL_': '动物奖励',
            'BONUS_POINTS_-_GET': '奖励分数-获得',
            'BONUS_POINTS': '奖励分数',
            'BUILDING_RESOURCES_-_ALL': '建造资源-所有',
            'BUILDING_RESOURCES_-_CLAY_(AND_WOOD)': '建造资源-黏土(和木材)',
            'BUILDING_RESOURCES_-_CLAY_AND/OR_STONE': '建造资源-黏土和/或石材',
            'BUILDING_RESOURCES_-_CLAY': '建造资源-黏土',
            'BUILDING_RESOURCES_-_REED': '建造资源-芦苇',
            'BUILDING_RESOURCES_-_STONE': '建造资源-石材',
            'BUILDING_RESOURCES_-_WOOD_(AND_CLAY)': '建造资源-木材(和黏土)',
            'BUILDING_RESOURCES_-_WOOD_OR_CLAY': '建造资源-木材或黏土',
            'BUILDING_RESOURCES_-_WOOD': '建造资源-木材',
            'CROPS_-_GRAIN_AND_VEGETABLE': '作物奖励-谷物和蔬菜',
            'CROPS_-_GRAIN': '作物奖励-谷物',
            'CROPS_-_SOWING': '作物奖励-播种',
            'CROPS_-_VEGETABLE': '作物奖励-蔬菜',
            'FARMYARD_-__FENCING_OR_STABLE_BUILDING': '农场规划-栅栏或畜棚',
            'FARMYARD_-_FENCING': '农场规划-栅栏',
            'FARMYARD_-_HOUSE_BUILDING_OR_RENOVATION': '农场规划-建造房屋或翻新',
            'FARMYARD_-_PLACE_FOR_ANIMALS': '农场规划-安置动物',
            'FARMYARD_-_PLACE_FOR_PERSON': '农场规划-安置家庭成员',
            'FARMYARD_-_PLOWING': '农场规划-耕种',
            'FARMYARD_-_STABLE_BUILDING': '农场规划-畜棚',
            'FIELD_-_GRAIN': '农田-谷物',
            'FIELD_-_VEGETABLE': '农田-蔬菜',
            'FOOD_-_CONVERSION': '食物-转换',
            'FOOD_-_COOKING': '食物-烹饪',
            'FOOD_-_FUTURE_ROUND_SPACES': '食物-之后轮次格',
            'food': '食物奖励',
            'GOODS_-_GET': '货物-获得',
            'PASSING_-_ACTION_-_FARMYARD': '传递-行动-农场规划',
            'PASSING_-_ANIMAL': '传递-动物奖励',
            'PASSING_-_BUILDING_RESOURCES_': '传递-建造资源奖励',
            'PASSING_-_CROP': '食物-作物奖励',
            'PASSING_-_FARMYARD': '食物-农场规划',
            'PASSING_-_FOOD': '食物-食物奖励',
            'PASSING_-_IMPROVEMENT/OCC_-_WOOD': '食物-发展/职业-木材',
        };

        return categoryMap[category] || category.replace(/_/g, ' ');
    }

    initUI() {
        // 初始化筛选器
        this.initFilters();

        // 初始化视图切换
        this.initViewControls();

        // 初始化排序
        this.initSortControls();

        // 新增：监听筛选器变化，避免在初始化前应用筛选
        this.initFilterListeners();
    }

    // 新增方法：初始化筛选器监听器
    initFilterListeners() {
        // 卡牌类型筛选
        document.getElementById('cardType').addEventListener('change', (e) => {
            if (!this.initialized) return; // 避免在初始化前触发
            this.filters.type = e.target.value;
            this.applyFilters();
        });

        // 扩展包筛选
        document.getElementById('deckFilter').addEventListener('change', (e) => {
            if (!this.initialized) return; // 避免在初始化前触发
            this.filters.deck = e.target.value;
            this.applyFilters();
        });

        // 搜索框
        document.getElementById('searchInput').addEventListener('input', (e) => {
            if (!this.initialized) return; // 避免在初始化前触发
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // 玩家人数筛选
        document.getElementById('playersFilter').addEventListener('change', (e) => {
            if (!this.initialized) return; // 避免在初始化前触发
            this.filters.players = e.target.value;
            this.applyFilters();
        });

        // 重置按钮
        document.getElementById('resetFilters').addEventListener('click', () => {
            if (!this.initialized) return; // 避免在初始化前触发
            this.resetFilters();
        });
    }

    initFilters() {
        // 卡牌类型筛选
        document.getElementById('cardType').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });

        // 扩展包筛选
        document.getElementById('deckFilter').addEventListener('change', (e) => {
            this.filters.deck = e.target.value;
            this.applyFilters();
        });

        // 分类筛选
        const categorySelect = document.getElementById('categoryFilter');
        const categories = [...new Set(this.cards.map(card => this.formatCategory(card.category)))].sort();

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyFilters();
        });

        // 搜索框
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // 玩家人数筛选
        document.getElementById('playersFilter').addEventListener('change', (e) => {
            this.filters.players = e.target.value;
            this.applyFilters();
        });

        // 重置按钮
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });
    }

    initViewControls() {
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按钮的active类
                viewBtns.forEach(b => b.classList.remove('active'));
                // 为点击的按钮添加active类
                btn.classList.add('active');

                this.currentView = btn.dataset.view;
                this.renderCards();
            });
        });
    }

    initSortControls() {
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortCards(e.target.value);
            this.renderCards();
        });
    }

    applyFilters() {
        if (this.cards.length === 0) {
            return;
        }
        this.filteredCards = this.cards.filter(card => {
            // 类型筛选
            if (this.filters.type !== 'all' && card.type !== this.filters.type) {
                return false;
            }

            // 扩展包筛选
            if (this.filters.deck !== 'all' && card.deck !== this.filters.deck) {
                return false;
            }

            // 分类筛选
            if (this.filters.category !== 'all' && this.formatCategory(card.category) !== this.filters.category) {
                return false;
            }

            // 搜索筛选
            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                const nameMatch = card.name.toLowerCase().includes(searchLower);
                const originalNameMatch = card.originalName ?
                    card.originalName.toLowerCase().includes(searchLower) : false;
                const numberMatch = card.numbering.toLowerCase().includes(searchLower);
                const descMatch = card.description.toLowerCase().includes(searchLower);

                if (!nameMatch && !originalNameMatch && !numberMatch && !descMatch) {
                    return false;
                }
            }

            if (this.filters.players !== 'all' && card.players !== this.filters.players) {
                return false;
            }

            return true;
        });

        // 默认按编号排序
        this.sortCards('numbering');
        this.renderCards();
        this.updateStats();
    }

    sortCards(sortBy) {
        this.filteredCards.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    // 按中文名称排序
                    return a.name.localeCompare(b.name, 'zh');
                default: // numbering
                    return a.numbering.localeCompare(b.numbering);
            }
        });
    }

    resetFilters() {
        // 重置筛选器UI
        document.getElementById('cardType').value = 'all';
        document.getElementById('deckFilter').value = 'all';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('searchInput').value = '';
        document.getElementById('playersFilter').value = 'all';

        // 重置筛选状态
        this.filters = {
            type: 'all',
            deck: 'all',
            category: 'all',
            search: '',
            players: 'all'
        };

        // 重新应用筛选
        if (this.initialized) {
            this.applyFilters();
        }
    }

    renderCards() {
        if (this.cards.length === 0) {
            const container = document.getElementById('cardsGrid');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>正在加载卡牌数据...</h3>
                </div>
            `;
            return;
        }
        if (this.currentView === 'grid') {
            this.renderGridView();
        } else {
            this.renderListView();
        }
    }

    renderGridView() {
        const container = document.getElementById('cardsGrid');
        const listContainer = document.getElementById('cardsList');

        // 显示网格容器，隐藏列表容器
        container.style.display = 'grid';
        listContainer.style.display = 'none';

        if (this.filteredCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-folder-open"></i>
                    <h3>没有找到匹配的卡牌</h3>
                    <p>尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            return;
        }

        // 清空容器
        container.innerHTML = '';

        // 创建卡牌并添加到容器
        this.filteredCards.forEach(card => {
            const cardElement = this.createAgricolaCardHTML(card);
            container.appendChild(cardElement);
        });
    }

    renderListView() {
        const container = document.getElementById('cardsList');
        const gridContainer = document.getElementById('cardsGrid');

        // 显示列表容器，隐藏网格容器
        container.style.display = 'block';
        gridContainer.style.display = 'none';

        if (this.filteredCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-folder-open"></i>
                    <h3>没有找到匹配的卡牌</h3>
                    <p>尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            return;
        }

        const listHTML = this.filteredCards.map(card => this.createListCardHTML(card)).join('');
        container.innerHTML = listHTML;
    }

    // 根据Cards.js中的tplPlayerCard函数创建Agricola风格的卡牌
    createAgricolaCardHTML(card) {
        const div = document.createElement('div');

        // 基础样式类
        const typeClass = card.type || 'minor';
        const classes = [
            'player-card',
            typeClass,
            'tooltipable',
            'selectable'
        ].filter(c => c).join(' ');

        // 设置数据属性
        div.id = card.id;
        div.className = classes;
        div.setAttribute('data-id', card.id);
        div.setAttribute('data-numbering', card.numbering);
        div.setAttribute('data-cook', card.cook || 'false');
        div.setAttribute('data-bread', card.bread || 'false');
        div.setAttribute('data-state', card.state || '0');

        // 创建卡牌内部结构
        const html = `
            <div class="player-card-resizable">
                <div class="player-card-inner">
                    <div class="card-frame"></div>
                    ${card.passing !== true ? '<div class="card-frame-left-leaves"></div><div class="card-frame-right-leaves"></div>' : ''}
                    <div class="card-icon"></div>
                    <div class="card-title">
                        ${card.name || ''}
                    </div>
                    <div class="card-numbering">${card.numbering || ''}</div>
                    <div class="card-bonus-vp-counter">${card.bonusVp || ''}</div>
                    ${card.players ? `<div class="card-players" data-n="${card.players}"></div>` : ''}
                    ${card.deck ? `<div class="card-deck" data-deck="${card.deck}"></div>` : ''}
                    ${card.vp != 0 ? `<div class="card-score" data-score="${card.vp}">${card.vp}</div>` : ''}
                    ${card.extraVp ? '<div class="card-extra-score"></div>' : ''}
                    ${card.category ? `<div class="card-category" data-category="${card.category}"></div>` : ''}
                    <div class="card-cost">
                        ${this.formatCardCostHTML(card)}
                    </div>
                    ${this.formatPrerequisiteHTML(card)}
                    <div class="card-desc">
                        <div class="card-desc-scroller">
                            ${this.formatCardDescription(card)}
                        </div>
                    </div>
                    <div class="card-bottom-left-corner"></div>
                    <div class="card-bottom-right-corner"></div>
                    ${card.holder ? this.createHolderHTML(card) : ''}
                </div>
                <div class="player-card-zoom">
                    <svg><use href="#zoom-svg"></use></svg>
                </div>
            </div>
            <div class="player-card-stats"></div>
            ${card.field ? '<div class="player-card-field-cell"></div>' : ''}
            ${!card.animalHolder ? '' : '<div class="resource-holder resource-holder-update animal-holder" data-n="0"></div>'}
        `;

        div.innerHTML = html;
        return div;
    }

    formatCardCostHTML(card) {
        // 根据Cards.js中的formatCardCost函数实现
        if (!card.costs) return '';

        // 处理费用文本
        let html = '';
        if (card.costText && card.costText !== '') {
            html += `<div class="card-cost-text">${card.costText}</div>`;
        }

        // 处理具体费用
        const costs = Array.isArray(card.costs) ? card.costs : [card.costs];

        costs.forEach((cost, index) => {
            if (Object.keys(cost).length === 0) return;

            const costItems = Object.entries(cost).map(([resource, amount]) => {
                const meepleClass = `meeple-${resource.toLowerCase()}`;
                return `<div>
                    ${amount}<div class="meeple-container">
                        <div class="agricola-meeple ${meepleClass}"></div>
                    </div>
                    </div>
                `;
            }).join('');

            html += `${costItems}`;

            // 添加分隔符（除了最后一个）
            if (index < costs.length - 1) {
                html += '<div class="card-cost-separator"></div>';
            }
        });

        // 处理额外费用
        if (card.fee) {
            const feeItems = Object.entries(card.fee).map(([resource, amount]) => {
                const meepleClass = `meeple-${resource.toLowerCase()}`;
                return `
                    <div class="meeple-container">
                        <div class="agricola-meeple ${meepleClass}"></div>
                    </div>
                    <span>${amount}</span>
                `;
            }).join('');

            html = `
                <div class="card-fee">${feeItems}</div>
                <div class="card-cost-fee-separator">+</div>
                ${html}
            `;
        }

        return html;
    }

    formatPrerequisiteHTML(card) {
        if (!card.prerequisite || card.prerequisite === '') return '';

        return `
            <div class="card-prerequisite">
                <div class="prerequisite-text">${card.prerequisite}</div>
            </div>
        `;
    }

    formatCardDescription(card) {
        // 直接从card对象获取描述
        return card.description || card.desc || '';
    }

    createHolderHTML(card) {
        let subHolders = '';
        if (card.id === "D75_WoodField") {
            subHolders = '<div class="subholder" data-x="0"></div><div class="subholder" data-x="-1"></div>';
        }
        if (card.id === "E80_RockGarden") {
            subHolders = '<div class="subholder" data-x="0"></div><div class="subholder" data-x="-1"></div><div class="subholder" data-x="-2"></div>';
        }

        return `
            <div class="resource-holder farmer-holder resource-holder-update ${card.actionCard ? 'actionCard' : ''}">
                ${subHolders}
            </div>
        `;
    }

    createListCardHTML(card) {
        const typeText = card.type === 'occupation' ? '职业卡牌' : '发展卡牌';
        const vpDisplay = card.vp > 0 ? `+${card.vp}` : '0';

        return `
            <div class="card-list-item" data-id="${card.id}">
                <div class="list-card-number">${card.numbering}</div>
                <div class="list-card-name">${card.name}</div>
                <div class="list-card-type">${typeText}</div>
                <div class="list-card-vp">${vpDisplay} VP</div>
            </div>
        `;
    }

    updateStats() {
        document.getElementById('totalCards').textContent = this.cards.length;
        document.getElementById('showingCards').textContent = this.filteredCards.length;
    }

    showErrorMessage(message) {
        const container = document.getElementById('cardsGrid');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new CardGallery();

    // 将实例附加到window对象，方便调试
    window.cardGallery = gallery;
});