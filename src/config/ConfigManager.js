/**
 * 配置管理器
 * 负责加载和管理所有游戏配置文件
 */
export default class ConfigManager {
  static instance = null;
  
  constructor() {
    this.chapters = null;
    this.maps = null;
    this.pieces = null;
    this.pieceTypes = null;
    this.loaded = false;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new ConfigManager();
    }
    return this.instance;
  }

  /**
   * 加载所有配置文件
   */
  async loadAllConfigs() {
    if (this.loaded) return;
    
    try {
      const [chapters, maps, pieces, pieceTypes] = await Promise.all([
        this.loadConfig('chapters.json'),
        this.loadConfig('maps.json'),
        this.loadConfig('pieces.json'),
        this.loadConfig('pieceTypes.json')
      ]);
      
      this.chapters = chapters;
      this.maps = maps;
      this.pieces = pieces;
      this.pieceTypes = pieceTypes;
      this.loaded = true;
      
      console.log('所有配置文件加载完成');
    } catch (error) {
      console.error('加载配置文件失败:', error);
      throw error;
    }
  }

  /**
   * 加载单个配置文件
   */
  async loadConfig(filename) {
    try {
      const response = await fetch(`/src/config/${filename}`);
      if (!response.ok) {
        throw new Error(`无法加载配置文件: ${filename}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`加载配置文件 ${filename} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取章节配置
   */
  getChapters() {
    return this.chapters?.chapters || [];
  }

  /**
   * 获取指定章节
   */
  getChapter(chapterId) {
    return this.chapters?.chapters?.find(c => c.id === chapterId);
  }

  /**
   * 获取指定关卡
   */
  getLevel(chapterId, levelId) {
    const chapter = this.getChapter(chapterId);
    return chapter?.levels?.find(l => l.id === levelId);
  }

  /**
   * 获取地图配置
   */
  getMapConfig(mapConfigId) {
    return this.maps?.[mapConfigId];
  }

  /**
   * 获取棋子配置
   */
  getPiecesConfig(piecesConfigId) {
    return this.pieces?.[piecesConfigId];
  }

  /**
   * 获取棋子类型配置
   */
  getPieceType(pieceType) {
    return this.pieceTypes?.[pieceType];
  }

  /**
   * 获取所有棋子类型
   */
  getAllPieceTypes() {
    return this.pieceTypes || {};
  }

  /**
   * 检查配置是否已加载
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * 重新加载配置
   */
  async reload() {
    this.loaded = false;
    await this.loadAllConfigs();
  }
} 