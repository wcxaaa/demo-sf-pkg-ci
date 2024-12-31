@IsTest
public with sharing class BonjourHiServiceTest {
  @IsTest
  static void testGreet() {
    BonjourHiService service = new BonjourHiService();
    String result = service.greet('Alice');
    Assert.areEqual('Bonjour Alice!', result);
  }
}
