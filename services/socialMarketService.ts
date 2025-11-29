/**
 * ============================================
 * Social Market Service
 * ============================================
 * 
 * Социальные рынки ANG Vers:
 * - Рынок услуг (разработка, дизайн, безопасность)
 * - Рынок найма (фриланс, контракты)
 * - Рейтинги работодателей и исполнителей
 * - Аукционы и торги
 * - Эскроу-система
 */

import { 
  SocialContract, 
  MarketListing,
  SocialProfile
} from '../types';
import { ANG_VERS_CORP } from './angVersService';

// ============================================
// Категории услуг
// ============================================
export const SERVICE_CATEGORIES = {
  development: {
    name: 'Разработка',
    icon: '💻',
    subcategories: ['Web', 'Mobile', 'Desktop', 'Games', 'AI/ML', 'Blockchain']
  },
  design: {
    name: 'Дизайн',
    icon: '🎨',
    subcategories: ['UI/UX', 'Graphics', 'Branding', '3D', 'Animation']
  },
  security: {
    name: 'Безопасность',
    icon: '🛡️',
    subcategories: ['Pentesting', 'Audit', 'Consulting', 'Incident Response']
  },
  hacking: {
    name: 'Хакинг',
    icon: '💀',
    subcategories: ['Data Recovery', 'Social Engineering', 'Custom Tools']
  },
  consulting: {
    name: 'Консалтинг',
    icon: '📊',
    subcategories: ['Business', 'Technical', 'Strategy', 'Architecture']
  },
  other: {
    name: 'Другое',
    icon: '📦',
    subcategories: ['Support', 'Training', 'Mentoring', 'Research']
  }
};

// ============================================
// Рейтинговые пороги
// ============================================
export const RATING_THRESHOLDS = {
  rookie: { min: 0, max: 2.5, label: 'Новичок', color: '#6B7280' },
  average: { min: 2.5, max: 3.5, label: 'Средний', color: '#3B82F6' },
  good: { min: 3.5, max: 4.2, label: 'Хороший', color: '#10B981' },
  excellent: { min: 4.2, max: 4.7, label: 'Отличный', color: '#8B5CF6' },
  elite: { min: 4.7, max: 5.0, label: 'Элита', color: '#F59E0B' }
};

// ============================================
// Типы контрактов с ценовыми диапазонами
// ============================================
export const CONTRACT_TYPES = {
  micro: { min: 10, max: 100, label: 'Микро-задача', duration: '1-2 дня' },
  small: { min: 100, max: 500, label: 'Малый проект', duration: '3-7 дней' },
  medium: { min: 500, max: 2000, label: 'Средний проект', duration: '1-2 недели' },
  large: { min: 2000, max: 10000, label: 'Крупный проект', duration: '2-4 недели' },
  enterprise: { min: 10000, max: 100000, label: 'Корпоративный', duration: '1-3 месяца' }
};

// ============================================
// Social Market Service
// ============================================
class SocialMarketService {
  
  // ==========================================
  // Listing Management
  // ==========================================
  
  /**
   * Создать листинг услуги
   */
  createServiceListing(
    sellerId: string,
    category: MarketListing['category'],
    title: string,
    description: string,
    price: number,
    deliveryDays: number = 7,
    revisions: number = 2
  ): { listing: MarketListing; fee: number } {
    const fee = ANG_VERS_CORP.fees.marketListingFee;
    
    return {
      listing: {
        id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sellerId,
        type: 'service',
        category,
        title,
        description,
        price,
        priceType: 'fixed',
        currency: 'usd',
        deliveryTime: deliveryDays,
        revisions,
        views: 0,
        purchases: 0,
        rating: 0,
        isActive: true,
        isFeatured: false,
        createdAt: Date.now()
      },
      fee
    };
  }
  
  /**
   * Поиск листингов
   */
  searchListings(
    listings: MarketListing[],
    query?: string,
    category?: MarketListing['category'],
    minPrice?: number,
    maxPrice?: number,
    minRating?: number
  ): MarketListing[] {
    return listings.filter(l => {
      if (!l.isActive) return false;
      if (query && !l.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (category && l.category !== category) return false;
      if (minPrice && l.price < minPrice) return false;
      if (maxPrice && l.price > maxPrice) return false;
      if (minRating && l.rating < minRating) return false;
      return true;
    });
  }
  
  /**
   * Получить топ листинги
   */
  getTopListings(listings: MarketListing[], limit: number = 10): MarketListing[] {
    return [...listings]
      .filter(l => l.isActive)
      .sort((a, b) => {
        // Сортировка: Featured первые, потом по рейтингу и продажам
        if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.purchases - a.purchases;
      })
      .slice(0, limit);
  }
  
  /**
   * Получить листинги продавца
   */
  getSellerListings(listings: MarketListing[], sellerId: string): MarketListing[] {
    return listings.filter(l => l.sellerId === sellerId);
  }
  
  /**
   * Обновить статистику листинга при просмотре
   */
  recordView(listing: MarketListing): MarketListing {
    return { ...listing, views: listing.views + 1 };
  }
  
  /**
   * Обновить статистику при покупке
   */
  recordPurchase(listing: MarketListing, rating: number): MarketListing {
    const newPurchases = listing.purchases + 1;
    // Средневзвешенный рейтинг
    const newRating = ((listing.rating * (newPurchases - 1)) + rating) / newPurchases;
    
    return {
      ...listing,
      purchases: newPurchases,
      rating: Math.round(newRating * 10) / 10
    };
  }
  
  // ==========================================
  // Contract Marketplace
  // ==========================================
  
  /**
   * Создать открытый контракт (Job posting)
   */
  createJobPosting(
    clientId: string,
    title: string,
    description: string,
    requirements: string[],
    budget: number,
    deadlineDays: number,
    category: MarketListing['category']
  ): SocialContract {
    return {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'freelance',
      clientId,
      title,
      description,
      requirements,
      payment: budget,
      paymentType: 'fixed',
      escrowHeld: 0,
      status: 'open',
      deadline: Date.now() + deadlineDays * 24 * 60 * 60 * 1000,
      createdAt: Date.now()
    };
  }
  
  /**
   * Поиск открытых контрактов
   */
  searchJobs(
    contracts: SocialContract[],
    minBudget?: number,
    maxBudget?: number,
    maxDeadlineDays?: number
  ): SocialContract[] {
    const now = Date.now();
    
    return contracts.filter(c => {
      if (c.status !== 'open') return false;
      if (c.contractorId) return false; // Уже взят
      if (minBudget && c.payment < minBudget) return false;
      if (maxBudget && c.payment > maxBudget) return false;
      
      if (maxDeadlineDays) {
        const daysLeft = (c.deadline - now) / (24 * 60 * 60 * 1000);
        if (daysLeft > maxDeadlineDays) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Подать заявку на контракт
   */
  applyForJob(contract: SocialContract, applicantId: string): { success: boolean; message: string } {
    if (contract.status !== 'open') {
      return { success: false, message: 'Контракт уже закрыт' };
    }
    
    if (contract.contractorId) {
      return { success: false, message: 'Исполнитель уже назначен' };
    }
    
    // В реальной системе здесь была бы очередь заявок
    return { success: true, message: 'Заявка подана' };
  }
  
  /**
   * Назначить исполнителя
   */
  assignContractor(
    contract: SocialContract, 
    contractorId: string,
    clientMoney: number
  ): { contract: SocialContract; escrowFee: number; success: boolean; message: string } {
    if (contract.status !== 'open') {
      return { contract, escrowFee: 0, success: false, message: 'Контракт недоступен' };
    }
    
    const escrowFee = Math.floor(contract.payment * ANG_VERS_CORP.fees.contractEscrowFee);
    const totalRequired = contract.payment + escrowFee;
    
    if (clientMoney < totalRequired) {
      return { 
        contract, 
        escrowFee, 
        success: false, 
        message: `Недостаточно средств. Требуется: $${totalRequired}` 
      };
    }
    
    return {
      contract: {
        ...contract,
        contractorId,
        status: 'in_progress',
        escrowHeld: contract.payment
      },
      escrowFee,
      success: true,
      message: 'Исполнитель назначен, средства в эскроу'
    };
  }
  
  // ==========================================
  // Dispute Resolution
  // ==========================================
  
  /**
   * Открыть спор по контракту
   */
  openDispute(contract: SocialContract, reason: string): SocialContract {
    return {
      ...contract,
      status: 'disputed'
    };
  }
  
  /**
   * Разрешить спор
   */
  resolveDispute(
    contract: SocialContract,
    resolution: 'client_wins' | 'contractor_wins' | 'split',
    splitRatio?: number // 0-1, доля для клиента
  ): { contract: SocialContract; clientRefund: number; contractorPayout: number } {
    let clientRefund = 0;
    let contractorPayout = 0;
    
    switch (resolution) {
      case 'client_wins':
        clientRefund = contract.escrowHeld;
        break;
      case 'contractor_wins':
        contractorPayout = contract.escrowHeld;
        break;
      case 'split':
        const ratio = splitRatio || 0.5;
        clientRefund = Math.floor(contract.escrowHeld * ratio);
        contractorPayout = contract.escrowHeld - clientRefund;
        break;
    }
    
    return {
      contract: {
        ...contract,
        status: 'completed',
        completedAt: Date.now(),
        escrowHeld: 0
      },
      clientRefund,
      contractorPayout
    };
  }
  
  // ==========================================
  // Ratings & Reviews
  // ==========================================
  
  /**
   * Получить рейтинговую метку
   */
  getRatingLabel(rating: number): { label: string; color: string } {
    for (const [_, threshold] of Object.entries(RATING_THRESHOLDS)) {
      if (rating >= threshold.min && rating < threshold.max) {
        return { label: threshold.label, color: threshold.color };
      }
    }
    return { label: 'N/A', color: '#6B7280' };
  }
  
  /**
   * Рассчитать репутацию продавца
   */
  calculateSellerReputation(profile: SocialProfile): number {
    let reputation = 0;
    
    // Базовый рейтинг
    reputation += profile.freelancerRating * 20;
    
    // Завершённые контракты
    reputation += profile.contractsCompleted * 5;
    
    // Штраф за проваленные
    reputation -= profile.contractsFailed * 15;
    
    // Штраф за жалобы
    reputation -= (profile.complaintsReceived - profile.complaintsResolved) * 10;
    
    // Бонус за верификацию
    reputation += profile.verificationLevel * 25;
    
    return Math.max(0, reputation);
  }
  
  /**
   * Рассчитать репутацию работодателя
   */
  calculateEmployerReputation(profile: SocialProfile): number {
    let reputation = 0;
    
    // Рейтинг как работодателя
    reputation += profile.employerRating * 20;
    
    // Контракты
    reputation += profile.contractsCompleted * 3;
    
    // Доверие
    reputation += profile.trustScore * 0.5;
    
    return Math.max(0, reputation);
  }
  
  // ==========================================
  // Market Analytics
  // ==========================================
  
  /**
   * Получить статистику категории
   */
  getCategoryStats(listings: MarketListing[], category: MarketListing['category']): {
    totalListings: number;
    avgPrice: number;
    avgRating: number;
    totalSales: number;
  } {
    const categoryListings = listings.filter(l => l.category === category && l.isActive);
    
    if (categoryListings.length === 0) {
      return { totalListings: 0, avgPrice: 0, avgRating: 0, totalSales: 0 };
    }
    
    const totalListings = categoryListings.length;
    const avgPrice = categoryListings.reduce((sum, l) => sum + l.price, 0) / totalListings;
    const avgRating = categoryListings.reduce((sum, l) => sum + l.rating, 0) / totalListings;
    const totalSales = categoryListings.reduce((sum, l) => sum + l.purchases, 0);
    
    return {
      totalListings,
      avgPrice: Math.round(avgPrice),
      avgRating: Math.round(avgRating * 10) / 10,
      totalSales
    };
  }
  
  /**
   * Получить рыночные тренды
   */
  getMarketTrends(listings: MarketListing[], contracts: SocialContract[]): {
    hotCategories: MarketListing['category'][];
    avgContractValue: number;
    openJobs: number;
    totalVolume: number;
  } {
    // Подсчёт по категориям
    const categoryCounts: Record<string, number> = {};
    for (const l of listings.filter(l => l.isActive)) {
      categoryCounts[l.category] = (categoryCounts[l.category] || 0) + l.purchases;
    }
    
    // Топ категории
    const hotCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat as MarketListing['category']);
    
    // Статистика контрактов
    const openJobs = contracts.filter(c => c.status === 'open').length;
    const completedContracts = contracts.filter(c => c.status === 'completed');
    const avgContractValue = completedContracts.length > 0
      ? completedContracts.reduce((sum, c) => sum + c.payment, 0) / completedContracts.length
      : 0;
    const totalVolume = completedContracts.reduce((sum, c) => sum + c.payment, 0);
    
    return {
      hotCategories,
      avgContractValue: Math.round(avgContractValue),
      openJobs,
      totalVolume
    };
  }
  
  // ==========================================
  // NPC Market Generation
  // ==========================================
  
  /**
   * Генерировать NPC листинг
   */
  generateNPCListing(): MarketListing {
    const categories: MarketListing['category'][] = ['development', 'design', 'security', 'consulting', 'other'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const titles: Record<MarketListing['category'], string[]> = {
      development: ['Web-разработка на React', 'Мобильное приложение', 'API интеграция', 'Full-stack проект'],
      design: ['UI/UX дизайн', 'Логотип и брендинг', '3D моделирование', 'Анимация интерфейса'],
      security: ['Аудит безопасности', 'Pentest веб-приложения', 'Настройка защиты', 'Анализ уязвимостей'],
      hacking: ['Восстановление данных', 'Социальная инженерия', 'Custom exploit'],
      consulting: ['Техническая консультация', 'Архитектурный обзор', 'Бизнес-аналитика'],
      other: ['Поддержка проекта', 'Обучение команды', 'Менторство']
    };
    
    const title = titles[category][Math.floor(Math.random() * titles[category].length)];
    const basePrice = Math.floor(Math.random() * 900) + 100;
    
    return {
      id: `npc_listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sellerId: `npc_seller_${Math.random().toString(36).substr(2, 9)}`,
      type: 'service',
      category,
      title,
      description: `Профессиональная услуга: ${title}`,
      price: basePrice,
      priceType: 'fixed',
      currency: 'usd',
      deliveryTime: 3 + Math.floor(Math.random() * 12),
      revisions: 1 + Math.floor(Math.random() * 3),
      views: Math.floor(Math.random() * 500),
      purchases: Math.floor(Math.random() * 50),
      rating: 3 + Math.random() * 2,
      isActive: true,
      isFeatured: Math.random() > 0.9,
      createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
  }
  
  /**
   * Генерировать NPC контракт
   */
  generateNPCContract(): SocialContract {
    const titles = [
      'Нужен разработчик на React',
      'Требуется специалист по безопасности',
      'Ищу дизайнера для проекта',
      'Необходима интеграция с API',
      'Срочно: исправление багов',
      'Разработка мобильного приложения'
    ];
    
    const title = titles[Math.floor(Math.random() * titles.length)];
    const payment = (Math.floor(Math.random() * 49) + 1) * 100; // 100-5000
    
    return {
      id: `npc_contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'freelance',
      clientId: `npc_client_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: `${title}. Детали обсуждаемы.`,
      requirements: ['Опыт работы', 'Портфолио'],
      payment,
      paymentType: 'fixed',
      escrowHeld: 0,
      status: 'open',
      deadline: Date.now() + (7 + Math.floor(Math.random() * 21)) * 24 * 60 * 60 * 1000,
      createdAt: Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)
    };
  }
}

export const socialMarketService = new SocialMarketService();
