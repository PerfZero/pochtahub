(function($) {
    'use strict';
    
    $(document).ready(function() {
        var $form = $('#transportcompany_form, #transportcompany-add-form, form');
        if ($form.length === 0) return;
        
        var isTransportCompanyForm = false;
        $form.each(function() {
            if ($(this).find('#id_name').length > 0 && $(this).find('#id_api_type').length > 0) {
                isTransportCompanyForm = true;
                return false;
            }
        });
        
        if (!isTransportCompanyForm) return;
        
        var $apiType = $('#id_api_type');
        var $apiAccount = $('#id_api_account');
        var $apiPassword = $('#id_api_secure_password');
        var $testFromCity = $('#id_test_from_city');
        var $testToCity = $('#id_test_to_city');
        var $testWeight = $('#id_test_weight');
        var $tariffCode = $('#id_default_tariff_code');
        var $tariffName = $('#id_default_tariff_name');
        
        function getCompanyId() {
            var urlMatch = window.location.pathname.match(/\/admin\/tariffs\/transportcompany\/(\d+)\//);
            if (urlMatch) {
                return urlMatch[1];
            }
            var idField = $('#id_id');
            if (idField.length && idField.val()) {
                return idField.val();
            }
            return null;
        }
        
        function loadTariffs() {
            var companyId = getCompanyId();
            var fromCity = $testFromCity.val();
            var toCity = $testToCity.val();
            var weight = $testWeight.val();
            
            if ($apiType.val() !== 'cdek') {
                alert('Выберите тип интеграции "CDEK API"');
                return;
            }
            
            if (!$apiAccount.val() || !$apiPassword.val()) {
                alert('Заполните API Account и API Secure Password');
                return;
            }
            
            if (!fromCity || !toCity || !weight) {
                alert('Заполните все поля для загрузки тарифов (города и вес)');
                return;
            }
            
            if (!companyId) {
                var apiAccount = $apiAccount.val();
                var apiPassword = $apiPassword.val();
                
                $tariffCode.prop('disabled', true);
                $tariffCode.html('<option value="">Загрузка...</option>');
                
                var url = '/api/tariffs/get-tariffs/?api_account=' + encodeURIComponent(apiAccount) +
                          '&api_secure_password=' + encodeURIComponent(apiPassword) +
                          '&from_city=' + encodeURIComponent(fromCity) +
                          '&to_city=' + encodeURIComponent(toCity) +
                          '&weight=' + encodeURIComponent(weight);
                
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: function(data) {
                        $tariffCode.html('<option value="">---------</option>');
                        if (data.tariffs && data.tariffs.length > 0) {
                            $.each(data.tariffs, function(i, tariff) {
                                var option = $('<option></option>')
                                    .attr('value', tariff.code)
                                    .text(tariff.code + ' - ' + tariff.name);
                                $tariffCode.append(option);
                            });
                        } else {
                            $tariffCode.html('<option value="">Тарифы не найдены</option>');
                        }
                        $tariffCode.prop('disabled', false);
                    },
                    error: function(xhr) {
                        var errorMsg = 'Ошибка загрузки тарифов';
                        if (xhr.responseJSON && xhr.responseJSON.error) {
                            errorMsg = xhr.responseJSON.error;
                        }
                        $tariffCode.html('<option value="">' + errorMsg + '</option>');
                        $tariffCode.prop('disabled', false);
                        alert(errorMsg);
                    }
                });
                return;
            }
            
            $tariffCode.prop('disabled', true);
            $tariffCode.html('<option value="">Загрузка...</option>');
            
            var url = '/api/tariffs/get-tariffs/?transport_company_id=' + companyId + 
                      '&from_city=' + encodeURIComponent(fromCity) + 
                      '&to_city=' + encodeURIComponent(toCity) + 
                      '&weight=' + encodeURIComponent(weight);
            
            $.ajax({
                url: url,
                method: 'GET',
                success: function(data) {
                    $tariffCode.html('<option value="">---------</option>');
                    if (data.tariffs && data.tariffs.length > 0) {
                        $.each(data.tariffs, function(i, tariff) {
                            var option = $('<option></option>')
                                .attr('value', tariff.code)
                                .text(tariff.code + ' - ' + tariff.name);
                            $tariffCode.append(option);
                        });
                    } else {
                        $tariffCode.html('<option value="">Тарифы не найдены</option>');
                    }
                    $tariffCode.prop('disabled', false);
                },
                error: function(xhr) {
                    var errorMsg = 'Ошибка загрузки тарифов';
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMsg = xhr.responseJSON.error;
                    }
                    $tariffCode.html('<option value="">' + errorMsg + '</option>');
                    $tariffCode.prop('disabled', false);
                    alert(errorMsg);
                }
            });
        }
        
        $tariffCode.on('change', function() {
            var selectedText = $(this).find('option:selected').text();
            if (selectedText && selectedText !== '---------') {
                var nameMatch = selectedText.match(/^\d+\s*-\s*(.+)$/);
                if (nameMatch) {
                    $tariffName.val(nameMatch[1]);
                }
            }
        });
        
        function addLoadButton() {
            if ($('#load-tariffs-btn').length > 0) {
                return;
            }
            
            var $tariffCodeRow = $tariffCode.closest('.form-row');
            if ($tariffCodeRow.length === 0) {
                $tariffCodeRow = $tariffCode.closest('div.field-default_tariff_code, .field-default_tariff_code');
            }
            if ($tariffCodeRow.length === 0) {
                $tariffCodeRow = $tariffCode.parent().parent();
            }
            
            var $loadButton = $('<button type="button" id="load-tariffs-btn" class="button" style="margin-top: 10px; margin-left: 10px;">Загрузить тарифы</button>');
            $loadButton.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                loadTariffs();
            });
            
            if ($tariffCodeRow.length > 0) {
                $tariffCodeRow.append($loadButton);
            } else {
                $tariffCode.after($loadButton);
            }
        }
        
        setTimeout(function() {
            addLoadButton();
        }, 100);
        
        setTimeout(function() {
            addLoadButton();
        }, 1000);
        
        var $submitRow = $('.submit-row');
        if ($submitRow.length > 0 && $('#load-tariffs-btn-submit').length === 0) {
            var $submitRowButton = $('<input type="button" id="load-tariffs-btn-submit" value="Загрузить тарифы" class="default" style="margin-left: 10px;">');
            $submitRowButton.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                loadTariffs();
            });
            $submitRow.append($submitRowButton);
        }
    });
})(django.jQuery);





